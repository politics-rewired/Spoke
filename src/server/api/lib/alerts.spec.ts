import {
  createCampaign,
  createCampaignContact
} from "__test__/testbed-preparation/core";
import nock from "nock";
import type { PoolClient } from "pg";
import { Pool } from "pg";
import supertest from "supertest";

import { createOrgAndSession } from "../../../../__test__/lib/session";
import { UserRoleType } from "../../../api/organization-membership";
import { config } from "../../../config";
import { createApp } from "../../app";
import { withClient } from "../../utils";
import { notifyLargeCampaignEvent } from "./alerts";

describe("notifyLargeCampaignEvent", () => {
  let pool: Pool;
  let agent: supertest.SuperAgentTest;

  const TEST_WEBHOOK_URL = "https://poke.spokerewired.com";

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    const app = await createApp();
    agent = supertest.agent(app);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  const setUpCampaign = async (client: PoolClient) => {
    const { organization } = await createOrgAndSession(client, {
      agent,
      role: UserRoleType.OWNER
    });
    const campaign = await createCampaign(client, {
      organizationId: organization.id
    });
    await Promise.all(
      [...new Array(10)].map(() =>
        createCampaignContact(client, { campaignId: campaign.id })
      )
    );
    return campaign;
  };

  it("notifies when contacts exceed threshold", async () => {
    await withClient(pool, async (client) => {
      const campaign = await setUpCampaign(client);

      let wasCalled = false;

      nock(TEST_WEBHOOK_URL)
        .post("/webhook")
        .reply(200, () => {
          wasCalled = true;
        });

      await notifyLargeCampaignEvent(
        campaign.id,
        "upload",
        5,
        `${TEST_WEBHOOK_URL}/webhook`
      );

      expect(wasCalled).toBe(true);
      expect(nock.isDone()).toBe(true);
    });
  });

  it("does not notify when contacts do not exceed threshold", async () => {
    await withClient(pool, async (client) => {
      const campaign = await setUpCampaign(client);

      let wasCalled = false;

      const nockScope = nock(TEST_WEBHOOK_URL)
        .post("/webhook")
        .reply(200, () => {
          wasCalled = true;
        });

      await notifyLargeCampaignEvent(
        campaign.id,
        "upload",
        15,
        `${TEST_WEBHOOK_URL}/webhook`
      );

      expect(wasCalled).toBe(false);
      expect(nockScope.isDone()).toBe(false);
      expect(nock.isDone()).toBe(false);
      nock.cleanAll();
    });
  });
});
