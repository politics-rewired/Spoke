import type { PoolClient } from "pg";
import { Pool } from "pg";
import supertest from "supertest";

import { createOrgAndSession } from "../../../../__test__/lib/session";
import {
  assignContacts,
  createAutoReplyTrigger,
  createCompleteCampaign,
  createInteractionStep,
  createMessage
} from "../../../../__test__/testbed-preparation/core";
import { UserRoleType } from "../../../api/organization-membership";
import { config } from "../../../config";
import { createApp } from "../../app";
import { withClient } from "../../utils";
import type { CampaignContactRecord } from "../types";

const sendReply = async (
  agent: supertest.SuperAgentTest,
  cookies: Record<string, string>,
  campaignContactId: number,
  message: string
) =>
  agent
    .post(`/graphql`)
    .set(cookies)
    .send({
      operationName: "SendReply",
      variables: {
        id: `${campaignContactId}`,
        message
      },
      query: `
        mutation SendReply($id: String!, $message: String!) {
          sendReply(id: $id, message: $message) {
            id
          }
        }
      `
    });

const createTestBed = async (
  client: PoolClient,
  agent: supertest.SuperAgentTest
) => {
  const { organization, user, cookies } = await createOrgAndSession(client, {
    agent,
    role: UserRoleType.OWNER
  });

  const {
    contacts: [contact],
    assignments: [assignment],
    campaign
  } = await createCompleteCampaign(client, {
    organization: { id: organization.id },
    texters: 1,
    contacts: 1
  });

  await assignContacts(client, assignment.id, campaign.id, 1);
  await createMessage(client, {
    assignmentId: assignment.id,
    campaignContactId: contact.id,
    contactNumber: contact.cell,
    text: "Hi! Want to attend my cool event?"
  });

  const rootStep = await createInteractionStep(client, {
    campaignId: campaign.id
  });

  const childStep = await createInteractionStep(client, {
    campaignId: campaign.id,
    parentInteractionId: rootStep.id
  });

  await createAutoReplyTrigger(client, {
    interactionStepId: childStep.id,
    token: "yes"
  });

  return { organization, user, cookies, contact, assignment };
};

describe("automatic message handling", () => {
  let pool: Pool;
  let agent: supertest.SuperAgentTest;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    const app = await createApp();
    agent = supertest.agent(app);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  test("does not opt out a contact who says START", async () => {
    const testbed = await withClient(pool, async (client) => {
      return createTestBed(client, agent);
    });

    await sendReply(agent, testbed.cookies, testbed.contact.id, "START");
    const {
      rows: [replyContact]
    } = await pool.query<CampaignContactRecord>(
      `select is_opted_out from campaign_contact where id = $1`,
      [testbed.contact.id]
    );

    expect(replyContact.is_opted_out).toBe(false);
  });

  test("opts out a contact who says STOP", async () => {
    const testbed = await withClient(pool, async (client) => {
      return createTestBed(client, agent);
    });

    await sendReply(agent, testbed.cookies, testbed.contact.id, "STOP");
    const {
      rows: [replyContact]
    } = await pool.query<CampaignContactRecord>(
      `select is_opted_out from campaign_contact where id = $1`,
      [testbed.contact.id]
    );

    expect(replyContact.is_opted_out).toBe(true);
  });

  test("does not respond to a contact who says YES! with no auto reply configured for the campaign", async () => {
    const testbed = await withClient(pool, async (client) => {
      return createTestBed(client, agent);
    });

    await sendReply(agent, testbed.cookies, testbed.contact.id, "YES");
    const {
      rows: [msgs]
    } = await pool.query(
      `select count(*) from message where campaign_contact_id = $1`,
      [testbed.contact.id]
    );

    const msgCount = parseInt(msgs.count, 10);
    expect(msgCount).toBe(2);
  });

  test("does not respond to a contact who says Yes, where? with a YES auto reply configured for the campaign", async () => {
    const testbed = await withClient(pool, async (client) => {
      return createTestBed(client, agent);
    });

    await sendReply(agent, testbed.cookies, testbed.contact.id, "Yes, where?");
    const {
      rows: [retryJobs]
    } = await pool.query(
      `
        select count(*) from graphile_worker.jobs 
        where task_identifier = 'retry-interaction-step'
        and payload->>'campaignContactId' = $1
      `,
      [testbed.contact.id]
    );

    const retryJobsCount = parseInt(retryJobs.count, 10);
    expect(retryJobsCount).toBe(0);
  });

  test("responds to a contact who says YES! with a YES auto reply configured for the campaign", async () => {
    const testbed = await withClient(pool, async (client) => {
      return createTestBed(client, agent);
    });

    await sendReply(agent, testbed.cookies, testbed.contact.id, "YES!");
    const {
      rows: [retryJobs]
    } = await pool.query(
      `
        select count(*) from graphile_worker.jobs 
        where task_identifier = 'retry-interaction-step'
        and payload->>'campaignContactId' = $1
      `,
      [testbed.contact.id]
    );

    const retryJobsCount = parseInt(retryJobs.count, 10);
    expect(retryJobsCount).toBe(1);
  });
});
