import { Pool } from "pg";
import supertest from "supertest";

import { createOrgAndSession } from "../../__test__/lib/session";
import { UserRoleType } from "../api/organization-membership";
import { config } from "../config";
import { createApp } from "./app";
import { withClient } from "./utils";

describe("get organization settings", () => {
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

  it("can read TexterOrganizationSettingsFragment as texter", async () => {
    const features = {
      showContactLastName: false,
      showContactCell: false,
      confirmationClickForScriptLinks: true
    };
    const { organization, cookies } = await withClient(pool, async (client) => {
      const result = await createOrgAndSession(client, {
        agent,
        role: UserRoleType.TEXTER,
        orgOptions: { features }
      });
      return result;
    });

    const response = await agent
      .post(`/graphql`)
      .set(cookies)
      .send({
        operationName: "GetOrganizationSettings",
        variables: {
          organizationId: `${organization.id}`
        },
        query: `
          query GetOrganizationSettings($organizationId: String!) {
            organization(id: $organizationId) {
              id
              settings {
                id
                showContactLastName
                showContactCell
                confirmationClickForScriptLinks
              }
            }
          }
        `
      });

    expect(response.ok).toBeTruthy();
    expect(response.body.data.organization.settings).toHaveProperty(
      "confirmationClickForScriptLinks"
    );
    expect(
      response.body.data.organization.settings.confirmationClickForScriptLinks
    ).toEqual(features.confirmationClickForScriptLinks);
  });

  it("cannot read protected settings as texter", async () => {
    const features = {
      numbersApiKey: "WhoahSomethingReallySecret",
      trollbotWebhookUrl: "https://domain.com/path/to/webhook"
    };
    const { organization, cookies } = await withClient(pool, async (client) => {
      const result = await createOrgAndSession(client, {
        agent,
        role: UserRoleType.TEXTER,
        orgOptions: { features }
      });
      return result;
    });

    const response = await agent
      .post(`/graphql`)
      .set(cookies)
      .send({
        operationName: "GetOrganizationSettings",
        variables: {
          organizationId: `${organization.id}`
        },
        query: `
          query GetOrganizationSettings($organizationId: String!) {
            organization(id: $organizationId) {
              id
              settings {
                id
                numbersApiKey
                trollbotWebhookUrl
              }
            }
          }
        `
      });

    expect(response.ok).toBe(true);
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.data.organization.settings.id).not.toBeNull();
    expect(response.body.data.organization.settings.numbersApiKey).toBeNull();
    expect(
      response.body.data.organization.settings.trollbotWebhookUrl
    ).toBeNull();
  });
});
