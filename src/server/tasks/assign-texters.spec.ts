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

  test('zeroes out "deleted" assignments for simple case', async () => {
    const { campaign, texters, assignments } = await createCompleteCampaign(
      client,
      {
        texters: 1,
        contacts: 150
      }
    );

    await assignContacts(client, assignments[0].id, campaign.id, 150);

    const initalContactCount = await texterContactCount(
      client,
      texters[0].id,
      campaign.id
    );
    expect(initalContactCount).toBe(150);

    await zeroOutDeleted({
      client,
      campaignId: campaign.id,
      isArchived: campaign.is_archived!,
      assignmentIds: [],
      ignoreAfterDate: DateTime.local().toUTC().plus({ hour: 1 }).toISO()
    });

    const finalContactCount = await texterContactCount(
      client,
      texters[0].id,
      campaign.id
    );
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

    await assignContacts(client, assignments[0].id, campaign.id, 75);
    await assignContacts(client, assignments[1].id, campaign.id, 75);

    const initalContactCount0 = await texterContactCount(
      client,
      texters[0].id,
      campaign.id
    );
    const initalContactCount1 = await texterContactCount(
      client,
      texters[1].id,
      campaign.id
    );
    expect(initalContactCount0).toBe(75);
    expect(initalContactCount1).toBe(75);

    await zeroOutDeleted({
      client,
      campaignId: campaign.id,
      isArchived: campaign.is_archived!,
      assignmentIds: [assignments[0].id],
      ignoreAfterDate: DateTime.local().toUTC().plus({ hour: 1 }).toISO()
    });

    const finalContactCount0 = await texterContactCount(
      client,
      texters[0].id,
      campaign.id
    );
    const finalContactCount1 = await texterContactCount(
      client,
      texters[1].id,
      campaign.id
    );
    expect(finalContactCount0).toBe(75);
    expect(finalContactCount1).toBe(0);
  });

  test("it frees up over-assigned texters (all needsMessage)", async () => {
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

  test("it frees up over-assigned texters (needs reply)", async () => {
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
      texters.map(({ id }) => texterContactCount(client, id, campaign.id))
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
