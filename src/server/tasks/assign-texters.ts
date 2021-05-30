import { Pool, PoolClient } from "pg";

import { TexterAssignmentInput } from "../../api/assignment";
import { DateTime } from "../../lib/datetime";
import { CampaignRecord } from "../api/types";
import { Notifications, sendUserNotification } from "../notifications";
import { withTransaction } from "../utils";
import { addProgressJob, ProgressTask } from "./utils";

export const TASK_IDENTIFIER = "assign-texters";

export interface AssignmentTarget {
  id: string;
  userId: string;
  contactsCount: number;
  operation: string;
}

interface EnsureAssignmentsOptions {
  client: PoolClient | Pool;
  campaignId: number;
  assignmentInputs: TexterAssignmentInput[];
}

export const ensureAssignments = async (options: EnsureAssignmentsOptions) => {
  const { client, campaignId, assignmentInputs } = options;
  const assignmentTargets: AssignmentTarget[] = [];
  for (const assignmentInput of assignmentInputs) {
    const {
      rows: [{ id, operation }]
    } = await client.query<{ id: string; operation: string }>(
      `
        insert into assignment (user_id, campaign_id)
        values ($1, $2)
        on conflict (user_id, campaign_id)
          -- force return value
          do update set user_id = EXCLUDED.user_id
        returning
          id,
          (case when created_at = updated_at then 'insert' else 'update' end) as operation
      `,
      [assignmentInput.userId, campaignId]
    );
    assignmentTargets.push({
      id,
      userId: assignmentInput.userId,
      contactsCount: assignmentInput.contactsCount,
      operation
    });
  }
  return assignmentTargets;
};

interface ZeroOutDeletedOptions {
  client: PoolClient | Pool;
  campaignId: number;
  isArchived: boolean;
  assignmentIds: number[];
  ignoreAfterDate: string;
}

export const zeroOutDeleted = async (options: ZeroOutDeletedOptions) => {
  const {
    client,
    campaignId,
    isArchived,
    assignmentIds,
    ignoreAfterDate
  } = options;
  await client.query(
    `
      update campaign_contact
      set assignment_id = null
      where
        campaign_id = $1
        and archived = ${isArchived}
        and assignment_id is not null
        and not assignment_id = ANY($2)
        and updated_at < $3
    `,
    [campaignId, assignmentIds, ignoreAfterDate]
  );
};

interface FreeUpTextersOptions {
  client: PoolClient;
  campaignId: number;
  isArchived: boolean;
  assignmentTargets: AssignmentTarget[];
  onProgress?: (percentComplete: number) => void | Promise<void>;
}

export const freeUpTexters = async (options: FreeUpTextersOptions) => {
  const {
    client,
    campaignId,
    isArchived,
    assignmentTargets,
    onProgress
  } = options;
  for (let index = 0; index < assignmentTargets.length; index += 1) {
    const assignmentTarget = assignmentTargets[index];
    const { id: assignmentId, contactsCount } = assignmentTarget;
    await client.query(
      `
        with cc_ids_to_keep as (
          select id
          from campaign_contact
          where
            campaign_id = $1
            and archived = ${isArchived}
            and assignment_id = $2
          order by id asc
          limit $3
        )
        update campaign_contact
        set assignment_id = null
        where
          campaign_id = $4
          and archived = ${isArchived}
          and assignment_id = $5
          and id not in (select id from cc_ids_to_keep)
      `,
      [campaignId, assignmentId, contactsCount, campaignId, assignmentId]
    );

    if (onProgress && index % 10 === 0) {
      const stagePercentCompelte = Math.floor(
        (index / assignmentTargets.length) * 100
      );
      await onProgress(stagePercentCompelte);
    }
  }
};

interface AssignPayloadsOptions {
  client: PoolClient;
  campaignId: number;
  isArchived: boolean;
  assignmentTargets: AssignmentTarget[];
}

export const assignPayloads = async (options: AssignPayloadsOptions) => {
  const { client, campaignId, isArchived, assignmentTargets } = options;

  const assignmentIds = assignmentTargets.map(({ id }) => parseInt(id, 10));
  const contactsCounts = assignmentTargets.map(
    ({ contactsCount }) => contactsCount
  );

  await client.query(
    `
      with raw_assignments as (
        select * from unnest($1::integer[], $2::integer[]) as t (assignment_id, desired_count)
      ),
      assignment_counts as (
        select
          assignment_id,
          generate_series(1, desired_count - (
            select count(*) from campaign_contact
            where campaign_contact.assignment_id = raw_assignments.assignment_id
          ))
        from raw_assignments
      ),
      assignments_payload as (
        select
          row_number() over () as row,
          assignment_id
        from assignment_counts
      ),
      assignable_contacts as (
        select
          row_number() over () as row,
          id as campaign_contact_id
          from campaign_contact
        where
          campaign_id = $3
          and archived = ${isArchived}
          and assignment_id is null
          and message_status = 'needsMessage'
      ),
      final_payloads as (
        select ap.assignment_id, ac.campaign_contact_id
        from assignments_payload ap
        join assignable_contacts ac on ac.row = ap.row
      )
      update campaign_contact cc
      set assignment_id = fp.assignment_id
      from final_payloads fp
      where cc.id = fp.campaign_contact_id
    `,
    [assignmentIds, contactsCounts, campaignId]
  );
};

interface SendAssignmentNotificationsOptions {
  campaignId: number;
  assignmentTargets: AssignmentTarget[];
}

const sendAssignmentNotifications = async (
  options: SendAssignmentNotificationsOptions
) => {
  const { campaignId, assignmentTargets } = options;
  await Promise.all(
    assignmentTargets.map(async (assignmentTarget) => {
      const assignment = {
        user_id: assignmentTarget.userId,
        campaign_id: campaignId
      };
      if (assignmentTarget.operation === "insert") {
        return sendUserNotification({
          type: Notifications.ASSIGNMENT_CREATED,
          assignment
        });
      }
      if (assignmentTarget.operation === "update") {
        return sendUserNotification({
          type: Notifications.ASSIGNMENT_UPDATED,
          assignment
        });
      }
    })
  );
};

export interface AssignTextersPayload {
  campaignId: number;
  assignmentInputs: TexterAssignmentInput[];
  ignoreAfterDate?: string;
}

export const assignTexters: ProgressTask<AssignTextersPayload> = async (
  payload,
  helpers
) => {
  const {
    campaignId,
    assignmentInputs,
    ignoreAfterDate = DateTime.local().toISO()
  } = payload;

  const campaign = await helpers
    .query<CampaignRecord>(`select * from campaign where id = $1 `, [
      campaignId
    ])
    .then(({ rows: [row] }) => row);

  const targets = await helpers.withPgClient((poolClient) =>
    withTransaction(poolClient, async (trx) => {
      // Ensure assignments for all texters
      const assignmentTargets = await ensureAssignments({
        client: trx,
        campaignId,
        assignmentInputs
      });
      await helpers.updateStatus(10);

      // Zero out "deleted" texters
      const assignmentIds = assignmentTargets.map(({ id }) => parseInt(id, 10));
      await zeroOutDeleted({
        client: trx,
        campaignId,
        isArchived: campaign.is_archived ?? false,
        assignmentIds,
        ignoreAfterDate
      });
      await helpers.updateStatus(20);

      // Free up contacts from assignment counts that have decreased
      await freeUpTexters({
        client: trx,
        campaignId,
        isArchived: campaign.is_archived ?? false,
        assignmentTargets,
        onProgress: (stagePercentComplete) =>
          helpers.updateStatus(20 + stagePercentComplete * 30)
      });
      await helpers.updateStatus(50);

      // Assign desired payloads to texters
      await assignPayloads({
        client: trx,
        campaignId,
        isArchived: campaign.is_archived ?? false,
        assignmentTargets
      });
      await helpers.updateStatus(95);

      return assignmentTargets;
    })
  );

  await sendAssignmentNotifications({
    campaignId,
    assignmentTargets: targets
  });
};

export const addAssignTexters = async (payload: AssignTextersPayload) =>
  addProgressJob({
    identifier: TASK_IDENTIFIER,
    payload
  });
