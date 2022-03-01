import { OrganizationSettingsInput } from "@spoke/spoke-codegen";
import { Pool } from "pg";
import supertest from "supertest";

import { createOrgAndSession } from "../../__test__/lib/session";
import {
  RequestAutoApproveType,
  UserRoleType
} from "../api/organization-membership";
import { config } from "../config";
import { writePermissionRequired } from "./api/organization-settings";
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

  const features = {
    opt_out_message: "Bye",
    showContactLastName: false,
    showContactCell: false,
    confirmationClickForScriptLinks: true,
    defaulTexterApprovalStatus: RequestAutoApproveType.APPROVAL_REQUIRED,
    numbersApiKey: "SomethingSecret",
    trollbotWebhookUrl: "https://rewired.coop/trolls"
  };

  const makeSettingsRequest = async (
    organizationId: number,
    cookies: Record<string, string>
  ) =>
    agent
      .post(`/graphql`)
      .set(cookies)
      .send({
        operationName: "GetOrganizationSettings",
        variables: {
          organizationId: `${organizationId}`
        },
        query: `
          query GetOrganizationSettings($organizationId: String!) {
            organization(id: $organizationId) {
              id
              settings {
                id
                optOutMessage
                showContactLastName
                showContactCell
                confirmationClickForScriptLinks
                defaulTexterApprovalStatus
                numbersApiKey
                trollbotWebhookUrl
              }
            }
          }
        `
      });

  it("can read only texter-level settings as texter", async () => {
    const { organization, cookies } = await withClient(pool, async (client) => {
      const result = await createOrgAndSession(client, {
        agent,
        role: UserRoleType.TEXTER,
        orgOptions: { features }
      });
      return result;
    });

    const response = await makeSettingsRequest(organization.id, cookies);

    expect(response.ok).toBeTruthy();
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors.length).toBeGreaterThan(0);
    const { settings } = response.body.data.organization;
    expect(settings).toHaveProperty("confirmationClickForScriptLinks");
    expect(settings.confirmationClickForScriptLinks).toEqual(
      features.confirmationClickForScriptLinks
    );
    expect(settings.id).not.toBeNull();
    expect(settings.numbersApiKey).toBeNull();
    expect(settings.trollbotWebhookUrl).toBeNull();
  });

  it("can read all settings as owner", async () => {
    const { organization, cookies } = await withClient(pool, async (client) => {
      const result = await createOrgAndSession(client, {
        agent,
        role: UserRoleType.OWNER,
        orgOptions: { features }
      });
      return result;
    });

    const response = await makeSettingsRequest(organization.id, cookies);

    expect(response.ok).toBe(true);
    expect(response.body).not.toHaveProperty("errors");
    const { settings } = response.body.data.organization;
    expect(settings.id).not.toBeNull();
    expect(settings.optOutMessage).toEqual(features.opt_out_message);
    expect(settings.showContactLastName).toEqual(features.showContactLastName);
    expect(settings.showContactCell).toEqual(features.showContactCell);
    expect(settings.confirmationClickForScriptLinks).toEqual(
      features.confirmationClickForScriptLinks
    );
    expect(settings.defaulTexterApprovalStatus).toEqual(
      features.defaulTexterApprovalStatus
    );
    expect(settings.numbersApiKey).not.toBeNull();
    expect(settings.trollbotWebhookUrl).toEqual(features.trollbotWebhookUrl);
  });

  it("returns the correct role required", () => {
    const ownerRole = writePermissionRequired({
      optOutMessage: "See ya"
    });
    expect(ownerRole).toEqual(UserRoleType.OWNER);
  });

  const makeSettingsUpdateRequest = async (
    organizationId: number,
    cookies: Record<string, string>,
    input: OrganizationSettingsInput
  ) =>
    agent
      .post(`/graphql`)
      .set(cookies)
      .send({
        operationName: "UpdateOrganizationSettings",
        variables: {
          organizationId: `${organizationId}`,
          input
        },
        query: `
          mutation UpdateOrganizationSettings($organizationId: String!, $input: OrganizationSettingsInput!) {
            editOrganizationSettings(id: $organizationId, input: $input) {
              id
            }
          }
        `
      });

  it("allows owner to update appropriately permissioned settings", async () => {
    const { organization, cookies } = await withClient(pool, async (client) => {
      const result = await createOrgAndSession(client, {
        agent,
        role: UserRoleType.OWNER,
        orgOptions: { features }
      });
      return result;
    });

    const validResponse = await makeSettingsUpdateRequest(
      organization.id,
      cookies,
      { optOutMessage: "Something new" }
    );
    expect(validResponse.ok).toBe(true);
  });

  it("allows superadmin to update appropriately permissioned settings", async () => {
    const { organization, cookies } = await withClient(pool, async (client) => {
      const result = await createOrgAndSession(client, {
        agent,
        role: UserRoleType.OWNER,
        orgOptions: { features }
      });
      return result;
    });

    const validResponse = await makeSettingsUpdateRequest(
      organization.id,
      cookies,
      { optOutMessage: "Something new" }
    );
    expect(validResponse.ok).toBe(true);
  });
});
