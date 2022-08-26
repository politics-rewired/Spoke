import type { PoolClient } from "pg";
import { Pool } from "pg";

import {
  createCompleteCampaign,
  createTexter
} from "../../../__test__/testbed-preparation/core";
import { config } from "../../config";
import { DateTime } from "../../lib/datetime";
import type { AssignmentRecord } from "../api/types";
import { MessageStatusType } from "../api/types";
import { withClient, withTransaction } from "../utils";
import type { AssignmentTarget } from "./assign-texters";
import {
  assignPayloads,
  ensureAssignments,
  freeUpTexters,
  zeroOutDeleted
} from "./assign-texters";

const texterContactCount = async (
  client: PoolClient,
  texterId: number,
  campaignId: number
) => {
  const {
    rows: [{ count }]
  } = await client.query<{ count: number }>(
    `
      select count(*)::integer as count
      from campaign_contact cc
      join assignment a on a.id = cc.assignment_id
      where
        a.user_id = $1
        and a.campaign_id = $2
    `,
    [texterId, campaignId]
  );
  return count;
};

const assignContacts = async (
  client: PoolClient,
  assignmentId: number,
  campaignId: number,
  count: number
) => {
  await client.query(
    `
      update campaign_contact
      set assignment_id = $1
      where id in (
        select id from campaign_contact
        where campaign_id = $2
          and assignment_id is null
        limit $3
      )
    `,
    [assignmentId, campaignId, count]
  );
};

describe("assign-texters", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  test("creates missing assignments", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const {
          campaign,
          texters: [texter0]
        } = await createCompleteCampaign(client, {
          texters: 1
        });
        const texter1 = await createTexter(client, {});

        const { rows: initialAssignments } = await client.query<
          AssignmentRecord
        >(`select * from assignment where campaign_id = $1`, [campaign.id]);
        expect(initialAssignments).toHaveLength(1);
        expect(initialAssignments[0].user_id).toBe(texter0.id);

        await ensureAssignments({
          client,
          campaignId: campaign.id,
          assignmentInputs: [
            { userId: `${texter0.id}`, contactsCount: 1 },
            { userId: `${texter1.id}`, contactsCount: 1 }
          ]
        });

        const { rows: finalAssignments } = await client.query<AssignmentRecord>(
          `select * from assignment where campaign_id = $1 order by user_id`,
          [campaign.id]
        );
        expect(finalAssignments).toHaveLength(2);
        expect(finalAssignments[0].user_id).toBe(texter0.id);
        expect(finalAssignments[1].user_id).toBe(texter1.id);
      });
    });
  });

  test("zeroes out all assignments for empty assignment targets", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const { campaign, texters, assignments } = await createCompleteCampaign(
          client,
          {
            texters: 3,
            contacts: 15
          }
        );

        await assignContacts(client, assignments[0].id, campaign.id, 4);
        await assignContacts(client, assignments[1].id, campaign.id, 5);
        await assignContacts(client, assignments[2].id, campaign.id, 6);

        await zeroOutDeleted({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentIds: [],
          ignoreAfterDate: DateTime.local().toUTC().plus({ hour: 1 }).toISO()
        });

        const finalCounts = await Promise.all(
          [...Array(3)].map((_, index) =>
            texterContactCount(client, texters[index].id, campaign.id)
          )
        );
        expect(finalCounts[0]).toBe(0);
        expect(finalCounts[1]).toBe(0);
        expect(finalCounts[2]).toBe(0);
      });
    });
  });

  test("zeroes out no unchanged assignments", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const { campaign, texters, assignments } = await createCompleteCampaign(
          client,
          {
            texters: 3,
            contacts: 15
          }
        );
        await assignContacts(client, assignments[0].id, campaign.id, 4);
        await assignContacts(client, assignments[1].id, campaign.id, 5);
        await assignContacts(client, assignments[2].id, campaign.id, 6);

        const assignmentIds = assignments.map(({ id }) => id);
        await zeroOutDeleted({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentIds,
          ignoreAfterDate: DateTime.local().toUTC().plus({ hour: 1 }).toISO()
        });

        const finalCounts = await Promise.all(
          [...Array(3)].map((_, index) =>
            texterContactCount(client, texters[index].id, campaign.id)
          )
        );
        expect(finalCounts[0]).toBe(4);
        expect(finalCounts[1]).toBe(5);
        expect(finalCounts[2]).toBe(6);
      });
    });
  });

  test("zeroes out deleted assignments for mixed case", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const { campaign, texters, assignments } = await createCompleteCampaign(
          client,
          {
            texters: 3,
            contacts: 15
          }
        );

        await assignContacts(client, assignments[0].id, campaign.id, 4);
        await assignContacts(client, assignments[1].id, campaign.id, 5);
        await assignContacts(client, assignments[2].id, campaign.id, 6);

        const initialCounts = await Promise.all(
          [...Array(3)].map((_, index) =>
            texterContactCount(client, texters[index].id, campaign.id)
          )
        );
        expect(initialCounts[0]).toBe(4);
        expect(initialCounts[1]).toBe(5);
        expect(initialCounts[2]).toBe(6);

        await zeroOutDeleted({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentIds: [assignments[0].id],
          ignoreAfterDate: DateTime.local().toUTC().plus({ hour: 1 }).toISO()
        });

        const finalCounts = await Promise.all(
          [...Array(3)].map((_, index) =>
            texterContactCount(client, texters[index].id, campaign.id)
          )
        );
        expect(finalCounts[0]).toBe(4);
        expect(finalCounts[1]).toBe(0);
        expect(finalCounts[2]).toBe(0);
      });
    });
  });

  test("it frees up over-assigned texters (all needsMessage)", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const { campaign, texters, assignments } = await createCompleteCampaign(
          client,
          {
            texters: 3,
            contacts: 45
          }
        );

        for (const assignment of assignments) {
          await assignContacts(client, assignment.id, campaign.id, 15);
        }

        const assignmentTargets: AssignmentTarget[] = assignments.map(
          (assignment, index) => ({
            id: `${assignment.id}`,
            userId: `${texters[index].id}`,
            contactsCount: 10,
            operation: "insert"
          })
        );

        await freeUpTexters({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentTargets
        });

        const assignedCounts = await Promise.all(
          texters.map(({ id }) => texterContactCount(client, id, campaign.id))
        );

        expect(assignedCounts).toHaveLength(3);
        expect(assignedCounts[0]).toBe(10);
        expect(assignedCounts[1]).toBe(10);
        expect(assignedCounts[2]).toBe(10);
      });
    });
  });

  test("it frees up over-assigned texters (needs reply)", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const contacts = [...Array(100)].map((_, index) => ({
          messageStatus:
            index >= 45
              ? MessageStatusType.NeedsMessage
              : MessageStatusType.NeedsResponse
        }));
        const { campaign, texters, assignments } = await createCompleteCampaign(
          client,
          {
            texters: 4,
            contacts
          }
        );

        // Assign replies for first 3 texters
        for (const assignment of assignments.slice(0, 3)) {
          await assignContacts(client, assignment.id, campaign.id, 15);
        }

        const assignmentTargets: AssignmentTarget[] = assignments.map(
          (assignment, index) => ({
            id: `${assignment.id}`,
            userId: `${texters[index].id}`,
            contactsCount: 15,
            operation: "insert"
          })
        );

        await freeUpTexters({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentTargets
        });

        const assignedCounts = await Promise.all(
          texters.map(({ id }) => texterContactCount(client, id, campaign.id))
        );

        expect(assignedCounts).toHaveLength(4);
        expect(assignedCounts[0]).toBe(15);
        expect(assignedCounts[1]).toBe(15);
        expect(assignedCounts[2]).toBe(15);
        expect(assignedCounts[3]).toBe(0); // Nothing to free up yet for the new texter
      });
    });
  });

  test("it does basic assignment", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const { campaign, texters, assignments } = await createCompleteCampaign(
          client,
          {
            texters: 3,
            contacts: 600
          }
        );

        const assignmentTargets: AssignmentTarget[] = assignments.map(
          (assignment, index) => ({
            id: `${assignment.id}`,
            userId: `${texters[index].id}`,
            contactsCount: (index + 1) * 100,
            operation: "insert"
          })
        );

        await assignPayloads({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentTargets
        });

        const assignedCounts = await Promise.all(
          texters.map(({ id }) => texterContactCount(client, id, campaign.id))
        );

        expect(assignedCounts).toHaveLength(3);
        expect(assignedCounts[0]).toBe(100);
        expect(assignedCounts[1]).toBe(200);
        expect(assignedCounts[2]).toBe(300);
      });
    });
  });

  test("it does assignment with existing conversations", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const { campaign, texters, assignments } = await createCompleteCampaign(
          client,
          {
            texters: 3,
            contacts: 600
          }
        );

        for (const assignment of assignments) {
          await assignContacts(client, assignment.id, campaign.id, 50);
        }

        const assignmentTargets: AssignmentTarget[] = assignments.map(
          (assignment, index) => ({
            id: `${assignment.id}`,
            userId: `${texters[index].id}`,
            contactsCount: (index + 1) * 100,
            operation: "insert"
          })
        );

        await assignPayloads({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentTargets
        });

        const assignedCounts = await Promise.all(
          texters.map(({ id }) => texterContactCount(client, id, campaign.id))
        );

        expect(assignedCounts).toHaveLength(3);
        expect(assignedCounts[0]).toBe(100);
        expect(assignedCounts[1]).toBe(200);
        expect(assignedCounts[2]).toBe(300);
      });
    });
  });

  test("it assigns conversations when no needsMessage conversations exist", async () => {
    await withClient(pool, async (poolClient) => {
      await withTransaction(poolClient, async (client) => {
        const {
          campaign,
          texters,
          assignments,
          contacts
        } = await createCompleteCampaign(client, {
          texters: 1,
          contacts: [
            { messageStatus: MessageStatusType.NeedsMessage },
            { messageStatus: MessageStatusType.NeedsResponse },
            { messageStatus: MessageStatusType.Conversation },
            { messageStatus: MessageStatusType.Messaged }
          ]
        });

        const assignmentTarget: AssignmentTarget = {
          id: `${assignments[0].id}`,
          userId: `${texters[0].id}`,
          contactsCount: contacts.length,
          operation: "insert"
        };

        await assignPayloads({
          client,
          campaignId: campaign.id,
          isArchived: campaign.is_archived!,
          assignmentTargets: [assignmentTarget]
        });

        const assignedCount = await texterContactCount(
          client,
          texters[0].id,
          campaign.id
        );

        expect(assignedCount).toBe(contacts.length);
      });
    });
  });
});
