import { DateTime } from "../../lib/datetime";
import { CampaignRecord } from "../api/types";
import { Notifications, sendUserNotification } from "../notifications";
import { withTransaction } from "../utils";
import { addProgressJob, ProgressTask } from "./utils";

export const TASK_IDENTIFIER = "assign-texters";

interface Texter {
  id: string;
  contactsCount: number;
}

export interface AssignTextersPayload {
  campaignId: number;
  texters: Texter[];
  ignoreAfterDate?: string;
}

export const assignTexters: ProgressTask<AssignTextersPayload> = async (
  payload,
  helpers
) => {
  const {
    campaignId,
    texters,
    ignoreAfterDate = DateTime.local().toISO()
  } = payload;

  const campaign = await helpers
    .query<CampaignRecord>(`select * from campaign where id = $1 `, [
      campaignId
    ])
    .then(({ rows: [row] }) => row);

  await helpers.withPgClient((poolClient) =>
    withTransaction(poolClient, async (trx) => {
      // Ensure assignments for all texters
      const assignmentTargets = [];
      for (const texter of texters) {
        const {
          rows: [{ id, operation }]
        } = await trx.query<{ id: string; operation: string }>(
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
          [texter.id, campaignId]
        );
        assignmentTargets.push({
          id,
          userId: texter.id,
          contactsCount: texter.contactsCount,
          operation
        });
      }

      await helpers.updateStatus(10);

      // Zero out "deleted" texters
      const assignmentIds = assignmentTargets.map(({ id }) => id);
      await trx.query(
        `
          update campaign_contact
          set assignment_id = null
          where
            campaign_id = $1
            and archived = ${campaign.is_archived}
            and assignment_id is not null
            and assignment_id <> ANY($2)
            and updated_at < $3
        `,
        [campaignId, assignmentIds, ignoreAfterDate]
      );

      await helpers.updateStatus(20);

      // Free up contacts from assignment counts that have decreased
      for (let index = 0; index < assignmentTargets.length; index += 1) {
        const assignmentTarget = assignmentTargets[index];
        const { id: assignmentId, contactsCount } = assignmentTarget;
        await trx.query(
          `
            with cc_ids_to_keep as (
              select id
              from campaign_contact
              where
                campaign_id = $1
                and archived = ${campaign.is_archived}
                and assignment_id = $2
              order by id asc
              limit $3
            )
            update campaign_contact
            set assignment_id = null
            where
              campaign_id = $4
              and archived = ${campaign.is_archived}
              and assignment_id = $5
              and id not in (select id from cc_ids_to_keep)
          `,
          [campaignId, assignmentId, contactsCount, campaignId, assignmentId]
        );

        if (index % 10 === 0) {
          const stagePercentCompelte = Math.floor(
            (index / assignmentTargets.length) * 30
          );
          await helpers.updateStatus(20 + stagePercentCompelte);
        }
      }

      await helpers.updateStatus(50);

      // Assign desired payloads to texters
      for (let index = 0; index < assignmentTargets.length; index += 1) {
        const assignmentTarget = assignmentTargets[index];
        const { id: assignmentId, contactsCount } = assignmentTarget;
        await trx.query(
          `
            with desired_contacts as (
              select id
              from campaign_contact
              where
                campaign_id = $1
                and archived = ${campaign.is_archived}
                and (
                  -- Existing contacts
                  assignment_id = $2
                  -- Unmessaged contacts
                  or (
                    assignment_id is null
                    and message_status = 'needsMessage'
                  )
                )
              order by assignment_id asc nulls last
              limit $3
              for update skip locked
            )
            update campaign_contact
            set assignment_id = $4
            where
              id in (
                select id from desired_contacts where assignment_id is null
              )
              and archived = ${campaign.is_archived}
          `,
          [campaignId, assignmentId, contactsCount, assignmentId]
        );

        if (index % 10 === 0) {
          const stagePercentCompelte = Math.floor(
            (index / assignmentTargets.length) * 45
          );
          await helpers.updateStatus(50 + stagePercentCompelte);
        }
      }

      await helpers.updateStatus(95);

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
    })
  );
};

export const addAssignTexters = async (payload: AssignTextersPayload) =>
  addProgressJob({
    identifier: TASK_IDENTIFIER,
    payload
  });
