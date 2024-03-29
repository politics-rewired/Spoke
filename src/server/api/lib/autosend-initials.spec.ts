import {
  createCampaign,
  createCampaignContact
} from "__test__/testbed-preparation/core";
import type { campaign as CampaignRecord } from "@spoke/spoke-codegen";
import type { PoolClient } from "pg";
import { Pool } from "pg";
import supertest from "supertest";

import { createOrgAndSession } from "../../../../__test__/lib/session";
import { UserRoleType } from "../../../api/organization-membership";
import { config } from "../../../config";
import { createApp } from "../../app";
import { withClient } from "../../utils";
import { MessageStatusType } from "../types";

const createTestBed = async (
  client: PoolClient,
  agent: supertest.SuperAgentTest,
  opts?: { mps?: number }
) => {
  const { organization, user, cookies } = await createOrgAndSession(client, {
    agent,
    role: UserRoleType.OWNER,
    ...(opts?.mps !== undefined
      ? { orgOptions: { autosending_mps: opts.mps } }
      : {})
  });
  const campaign = await createCampaign(client, {
    organizationId: organization.id,
    isStarted: true
  });
  await Promise.all(
    [...Array(5)].map(() =>
      createCampaignContact(client, {
        campaignId: campaign.id,
        messageStatus: MessageStatusType.NeedsMessage
      })
    )
  );
  return { organization, user, cookies, campaign };
};

const queueCampaign = async (
  agent: supertest.SuperAgentTest,
  cookies: Record<string, string>,
  campaignId: number
) =>
  agent
    .post(`/graphql`)
    .set(cookies)
    .send({
      operationName: "StartAutosending",
      variables: {
        campaignId: `${campaignId}`
      },
      query: `
        mutation StartAutosending($campaignId: String!) {
          startAutosending(campaignId: $campaignId) {
            id
            autosendStatus
          }
        }
      `
    });

describe("autosend initials mutations", () => {
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

  it("does not create queue campaign for organization without allocated mps", async () => {
    const testbed = await withClient(pool, async (client) => {
      return createTestBed(client, agent);
    });

    await queueCampaign(agent, testbed.cookies, testbed.campaign.id);

    const {
      rows: [campaign]
    } = await pool.query<CampaignRecord>(
      `select * from campaign where id = $1`,
      [testbed.campaign.id]
    );

    expect(campaign.autosend_status).toBeNull();

    const {
      rowCount
    } = await pool.query(
      `select * from graphile_worker.jobs where task_identifier = $1`,
      ["queue-autosend-organization-initials"]
    );

    expect(rowCount).toBe(0);
  });

  it("creates queue-autosend-organization-initials job on startAutsending", async () => {
    const testbed = await withClient(pool, async (client) => {
      return createTestBed(client, agent, { mps: 30 });
    });

    await queueCampaign(agent, testbed.cookies, testbed.campaign.id);

    const {
      rows: [campaign]
    } = await pool.query<CampaignRecord>(
      `select * from campaign where id = $1`,
      [testbed.campaign.id]
    );

    expect(campaign.autosend_status).toBe("sending");
    expect(campaign.autosend_user_id).toBe(testbed.user.id);

    const {
      rows: [job]
    } = await pool.query(
      `select * from graphile_worker.jobs where task_identifier = $1`,
      ["queue-autosend-organization-initials"]
    );

    expect(job).not.toBeUndefined();

    await pool.query(
      `delete from graphile_worker.jobs where task_identifier = $1`,
      ["queue-autosend-organization-initials"]
    );
  });
});
