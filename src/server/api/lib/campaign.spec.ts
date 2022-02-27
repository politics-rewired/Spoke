import { Pool } from "pg";
import supertest from "supertest";

import {
  createOrgAndSession,
  createSession
} from "../../../../__test__/lib/session";
import {
  createCampaign,
  createCompleteCampaign,
  createMessage,
  createOrganization,
  createUser,
  createUserOrganization
} from "../../../../__test__/testbed-preparation/core";
import { UserRoleType } from "../../../api/organization-membership";
import { config } from "../../../config";
import { createApp } from "../../app";
import { withClient } from "../../utils";
import { OrganizationRecord } from "../types";
import { getDeliverabilityStats } from "./campaign";

describe("getDeliverabilityStats", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  test("generates correct stats for mixed errors", async () => {
    await withClient(pool, async (client) => {
      const {
        campaign,
        contacts: [contact],
        assignments: [assignment]
      } = await createCompleteCampaign(client, { texters: 1, contacts: 1 });
      const message = {
        campaignContactId: contact.id,
        assignmentId: assignment.id,
        sendStatus: "ERROR"
      };

      const createErrorMessage = async (count: number, errorCode?: string) =>
        Promise.all(
          [...Array(count)].map((_) =>
            createMessage(client, {
              ...message,
              errorCodes: errorCode ? [errorCode] : undefined
            })
          )
        );

      const errors: [number, string | null][] = [
        [4, "30001"],
        [3, "30004"],
        [2, "30011"],
        [3, null]
      ];

      for (const [count, errorCode] of errors) {
        await createErrorMessage(count, errorCode ?? undefined);
      }

      const stats = await getDeliverabilityStats(campaign.id);
      expect(stats.deliveredCount).toBe(0);
      expect(stats.sentCount).toBe(0);
      expect(stats.errorCount).toBe(12);
      expect(stats.specificErrors).toHaveLength(4);

      errors.forEach(([count, errorCode]) => {
        // See: https://medium.com/@andrei.pfeiffer/jest-matching-objects-in-array-50fe2f4d6b98
        expect(stats.specificErrors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ count, errorCode })
          ])
        );
      });
    });
  });

  test("generates correct stats for mixed null and empty list error codes", async () => {
    await withClient(pool, async (client) => {
      const {
        campaign,
        contacts: [contact],
        assignments: [assignment]
      } = await createCompleteCampaign(client, { texters: 1, contacts: 1 });

      await createMessage(client, {
        campaignContactId: contact.id,
        assignmentId: assignment.id,
        sendStatus: "ERROR",
        errorCodes: []
      });

      await createMessage(client, {
        campaignContactId: contact.id,
        assignmentId: assignment.id,
        sendStatus: "ERROR",
        errorCodes: undefined
      });

      const stats = await getDeliverabilityStats(campaign.id);

      expect(stats.deliveredCount).toBe(0);
      expect(stats.sentCount).toBe(0);
      expect(stats.errorCount).toBe(2);
      expect(stats.specificErrors).toHaveLength(1);
      expect(stats.specificErrors[0].errorCode).toBeNull();
    });
  });
});

describe("create / edit campaign", () => {
  let pool: Pool;
  let organization: OrganizationRecord;
  let agent: supertest.SuperAgentTest;
  let cookies: Record<string, string>;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    const app = await createApp();
    agent = supertest.agent(app);
    await withClient(pool, async (client) => {
      organization = await createOrganization(client, {});

      const password = "KeepItSecretKeepItSafe";
      const user = await createUser(client, { password });
      await createUserOrganization(client, {
        userId: user.id,
        organizationId: organization.id,
        role: UserRoleType.OWNER
      });
      cookies = await createSession({ agent, email: user.email, password });
    });
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("creates a blank campaign", async () => {
    const response = await agent
      .post(`/graphql`)
      .set(cookies)
      .send({
        operationName: "createBlankCampaign",
        variables: {
          campaign: {
            title: "New Campaign",
            description: "",
            dueBy: null,
            organizationId: `${organization.id}`,
            contacts: [],
            interactionSteps: {
              scriptOptions: [""]
            }
          }
        },
        query: `
          mutation createBlankCampaign($campaign: CampaignInput!) {
            createCampaign(campaign: $campaign) {
              id
            }
          }
        `
      });

    expect(response.ok).toBeTruthy();
    expect(response.body.data.createCampaign).toHaveProperty("id");
  });

  const mockCampaign = async (args: {
    role: UserRoleType;
    startCampaignRequiresApproval: boolean;
    isStarted: boolean;
    isApproved: boolean;
  }) => {
    const { role, startCampaignRequiresApproval, isStarted, isApproved } = args;
    const mocks = await withClient(pool, async (client) => {
      const result = await createOrgAndSession(client, {
        agent,
        role,
        orgOptions: { features: { startCampaignRequiresApproval } }
      });
      const campaign = await createCampaign(client, {
        organizationId: result.organization.id,
        isStarted,
        isApproved
      });
      return { ...result, campaign };
    });
    return mocks;
  };

  const startCampaignReq = async (
    reqCookies: Record<string, string>,
    campaignId: number
  ) => {
    const response = await agent
      .post(`/graphql`)
      .set(reqCookies)
      .send({
        operationName: "StartCampaign",
        variables: { campaignId: `${campaignId}` },
        query: `
          mutation StartCampaign($campaignId: String!) {
            startCampaign(id: $campaignId) {
              id
              isStarted
              isApproved
            }
          }
        `
      });
    return response;
  };

  it("allows an owner to start a campaign by default", async () => {
    const mocks = await mockCampaign({
      role: UserRoleType.OWNER,
      startCampaignRequiresApproval: false,
      isStarted: false,
      isApproved: false
    });

    const response = await startCampaignReq(mocks.cookies, mocks.campaign.id);

    expect(response.ok).toBe(true);
    expect(response.body.data.startCampaign.isStarted).toBe(true);
  });

  it("prevents an owner from starting a campaign if unapproved", async () => {
    const mocks = await mockCampaign({
      role: UserRoleType.OWNER,
      startCampaignRequiresApproval: true,
      isStarted: false,
      isApproved: false
    });

    const response = await startCampaignReq(mocks.cookies, mocks.campaign.id);

    expect(response.ok).toBe(true);
    expect(response.body.data.startCampaign).toBeNull();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it("allows an owner to start a campaign if approved", async () => {
    const mocks = await mockCampaign({
      role: UserRoleType.OWNER,
      startCampaignRequiresApproval: true,
      isStarted: false,
      isApproved: true
    });

    const response = await startCampaignReq(mocks.cookies, mocks.campaign.id);

    expect(response.ok).toBe(true);
    expect(response.body.data.startCampaign.isStarted).toBe(true);
  });

  it("allows a superadmin to start a campaign if unapproved", async () => {
    const mocks = await mockCampaign({
      role: UserRoleType.SUPERADMIN,
      startCampaignRequiresApproval: true,
      isStarted: false,
      isApproved: false
    });

    const response = await startCampaignReq(mocks.cookies, mocks.campaign.id);

    expect(response.ok).toBe(true);
    const { startCampaign } = response.body.data;
    expect(startCampaign.isStarted).toBe(true);
    expect(startCampaign.isApproved).toBe(true);
  });

  const campaignEdits = {
    questionText: "How are they?",
    scriptOption: "How are you doing?"
  };

  const makeEdits = async (
    cookiesForEdit: Record<string, string>,
    campaignId: number
  ) => {
    const response = await agent
      .post(`/graphql`)
      .set(cookiesForEdit)
      .send({
        operationName: "EditCampaign",
        variables: {
          campaignId: `${campaignId}`,
          campaign: {
            interactionSteps: {
              id: "new",
              scriptOptions: [campaignEdits.scriptOption],
              questionText: campaignEdits.questionText,
              interactionSteps: []
            }
          }
        },
        query: `
          mutation EditCampaign($campaignId: String!, $campaign: CampaignInput!) {
            editCampaign(id: $campaignId, campaign: $campaign) {
              id
              isStarted
              isApproved
              interactionSteps {
                id
                questionText
                scriptOptions
              }
            }
          }
        `
      });
    return response;
  };

  it("unstarts running campaign if owner makes changes", async () => {
    const mocks = await mockCampaign({
      role: UserRoleType.OWNER,
      startCampaignRequiresApproval: true,
      isStarted: true,
      isApproved: true
    });

    const response = await makeEdits(mocks.cookies, mocks.campaign.id);

    expect(response.ok).toBe(true);
    const { editCampaign } = response.body.data;
    expect(editCampaign.isStarted).toBe(false);
    expect(editCampaign.isApproved).toBe(false);
    expect(editCampaign.interactionSteps[0].questionText).toEqual(
      campaignEdits.questionText
    );
    expect(editCampaign.interactionSteps[0].scriptOptions[0]).toEqual(
      campaignEdits.scriptOption
    );
  });

  it("does not unstart running campaign if superadmin makes changes", async () => {
    const mocks = await mockCampaign({
      role: UserRoleType.SUPERADMIN,
      startCampaignRequiresApproval: true,
      isStarted: true,
      isApproved: true
    });

    const response = await makeEdits(mocks.cookies, mocks.campaign.id);

    expect(response.ok).toBe(true);
    const { editCampaign } = response.body.data;
    expect(editCampaign.isStarted).toBe(true);
    expect(editCampaign.isApproved).toBe(mocks.campaign.is_approved);
    expect(editCampaign.interactionSteps[0].questionText).toEqual(
      campaignEdits.questionText
    );
    expect(editCampaign.interactionSteps[0].scriptOptions[0]).toEqual(
      campaignEdits.scriptOption
    );
  });
});
