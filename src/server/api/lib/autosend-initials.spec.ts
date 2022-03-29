import {
  createCampaign,
  createCampaignContact
} from "__test__/testbed-preparation/core";
import { campaign as CampaignRecord } from "@spoke/spoke-codegen";
import { Pool } from "pg";
import { UserRoleType } from "src/api/organization-membership";
import supertest from "supertest";

import { createOrgAndSession } from "../../../../__test__/lib/session";
import { config } from "../../../config";
import { createApp } from "../../app";
import { withClient } from "../../utils";
import { MessageStatusType } from "../types";

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

  it("creates queue-autosend-initials job on startAutsending", async () => {
    const testbed = await withClient(pool, async (client) => {
      const { organization, user, cookies } = await createOrgAndSession(
        client,
        {
          agent,
          role: UserRoleType.OWNER
        }
      );
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
    });

    await agent
      .post(`/graphql`)
      .set(testbed.cookies)
      .send({
        operationName: "StartAutosending",
        variables: {
          campaignId: `${testbed.campaign.id}`
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
      ["queue-autosend-initials"]
    );

    expect(job).not.toBeUndefined();

    await pool.query(
      `delete from graphile_worker.jobs where task_identifier = $1`,
      ["queue-autosend-initials"]
    );
  });
});
