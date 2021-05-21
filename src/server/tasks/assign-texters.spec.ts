import { Pool, PoolClient } from "pg";

import {
  createCompleteCampaign,
  createTexter
} from "../../../__test__/testbed-preparation/core";
import { config } from "../../config";
import { DateTime } from "../../lib/datetime";
import { AssignmentRecord, MessageStatusType } from "../api/types";
import {
  AssignmentTarget,
  assignPayloads,
  ensureAssignments,
  zeroOutDeleted
} from "./assign-texters";

const texterContactCount = async (client: PoolClient, texterId: number) => {
  const {
    rows: [{ count }]
  } = await client.query<{ count: number }>(
    `
      select count(*)::integer as count
      from campaign_contact cc
      join assignment a on a.id = cc.assignment_id
      where user_id = $1
    `,
    [texterId]
  );
  return count;
};

describe("assign-texters", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    client = await pool.connect();
  });

  beforeEach(async () => {
    client.query(`begin`);
  });

  afterEach(async () => {
    client.query(`rollback`);
  });

  afterAll(async () => {
    if (client) client.release();
    if (pool) await pool.end();
  });

  test("creates missing assignments", async () => {
    const {
      campaign,
      texters: [texter0]
    } = await createCompleteCampaign(client, {
      texters: 1
    });
    const texter1 = await createTexter(client, {});

    const { rows: initialAssignments } = await client.query<AssignmentRecord>(
      `select * from assignment where campaign_id = $1`,
      [campaign.id]
    );
    expect(initialAssignments).toHaveLength(1);
    expect(initialAssignments[0].user_id).toBe(texter0.id);

    await ensureAssignments({
      client,
      campaignId: campaign.id,
      texters: [
        { id: `${texter0.id}`, contactsCount: 1 },
        { id: `${texter1.id}`, contactsCount: 1 }
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

  test('zeroes out "deleted" assignments for simple case', async () => {
    const { campaign, texters, assignments } = await createCompleteCampaign(
      client,
      {
        texters: 1,
        contacts: 150
      }
    );

    await client.query(
      `update campaign_contact set assignment_id = $1 where campaign_id = $2`,
      [assignments[0].id, campaign.id]
    );

    const initalContactCount = await texterContactCount(client, texters[0].id);
    expect(initalContactCount).toBe(150);

    await zeroOutDeleted({
      client,
      campaignId: campaign.id,
      isArchived: campaign.is_archived!,
      assignmentIds: [],
      ignoreAfterDate: DateTime.local().toUTC().plus({ hour: 1 }).toISO()
    });

    const finalContactCount = await texterContactCount(client, texters[0].id);
    expect(finalContactCount).toBe(0);
  });

  test('zeroes out "deleted" assignments for "complex" case', async () => {
    const { campaign, texters, assignments } = await createCompleteCampaign(
      client,
      {
        texters: 2,
        contacts: 150
      }
    );

    await client.query(
      `
        update campaign_contact
        set assignment_id = $1
        where id in (
          select id from campaign_contact
          where campaign_id = $2
            and assignment_id is null
          limit $3
        )`,
      [assignments[0].id, campaign.id, 75]
    );

    await client.query(
      `
        update campaign_contact
        set assignment_id = $1
        where id in (
          select id from campaign_contact
          where campaign_id = $2
            and assignment_id is null
          limit $3
        )`,
      [assignments[1].id, campaign.id, 75]
    );

    const initalContactCount0 = await texterContactCount(client, texters[0].id);
    const initalContactCount1 = await texterContactCount(client, texters[1].id);
    expect(initalContactCount0).toBe(75);
    expect(initalContactCount1).toBe(75);

    await zeroOutDeleted({
      client,
      campaignId: campaign.id,
      isArchived: campaign.is_archived!,
      assignmentIds: [assignments[0].id],
      ignoreAfterDate: DateTime.local().toUTC().plus({ hour: 1 }).toISO()
    });

    const finalContactCount0 = await texterContactCount(client, texters[0].id);
    const finalContactCount1 = await texterContactCount(client, texters[1].id);
    expect(finalContactCount0).toBe(75);
    expect(finalContactCount1).toBe(0);
  });

  test("it does basic assignment", async () => {
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
      texters.map(({ id }) => texterContactCount(client, id))
    );

    expect(assignedCounts).toHaveLength(3);
    expect(assignedCounts[0]).toBe(100);
    expect(assignedCounts[1]).toBe(200);
    expect(assignedCounts[2]).toBe(300);
  });

  test("it does assignment with existing conversations", async () => {
    const { campaign, texters, assignments } = await createCompleteCampaign(
      client,
      {
        texters: 3,
        contacts: 600
      }
    );

    for (const assignment of assignments) {
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
        [assignment.id, campaign.id, 50]
      );
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
      texters.map(({ id }) => texterContactCount(client, id))
    );

    expect(assignedCounts).toHaveLength(3);
    expect(assignedCounts[0]).toBe(100);
    expect(assignedCounts[1]).toBe(200);
    expect(assignedCounts[2]).toBe(300);
  });

  test("it assigns conversations when no needsMessage conversations exist", async () => {
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

    const assignedCount = await texterContactCount(client, texters[0].id);

    expect(assignedCount).toBe(contacts.length);
  });
});
