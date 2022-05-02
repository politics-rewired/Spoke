import { Pool, PoolClient } from "pg";
import supertest from "supertest";

import { createSession } from "../../__test__/lib/session";
import {
  createOrganization,
  createUser,
  createUserOrganization
} from "../../__test__/testbed-preparation/core";
import { UserRoleType } from "../api/organization-membership";
import { config } from "../config";
import { createApp } from "./app";
import { withClient } from "./utils";

describe("manage user sessions", () => {
  let pool: Pool;
  let superadminAgent: supertest.SuperAgentTest;
  let texterAgent: supertest.SuperAgentTest;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    const app = await createApp();
    // Use agent per-user: https://github.com/visionmedia/supertest/issues/743
    superadminAgent = supertest.agent(app);
    texterAgent = supertest.agent(app);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  const setUpSessionTest = async (client: PoolClient) => {
    const organization = await createOrganization(client, {});

    const password = "KeepItSecretKeepItSafe";
    const superadmin = await createUser(client, {
      password,
      isSuperadmin: true
    });
    await createUserOrganization(client, {
      userId: superadmin.id,
      organizationId: organization.id,
      role: UserRoleType.OWNER
    });
    const superadminCookies = await createSession({
      agent: superadminAgent,
      email: superadmin.email,
      password
    });
    const texter = await createUser(client, {
      password,
      isSuperadmin: false
    });
    const texterId = `${texter.id}`;
    await createUserOrganization(client, {
      userId: texter.id,
      organizationId: organization.id,
      role: UserRoleType.TEXTER
    });
    const texterCookies = await createSession({
      agent: texterAgent,
      email: texter.email,
      password
    });

    return {
      password,
      superadmin,
      superadminCookies,
      texter,
      texterId,
      texterCookies
    };
  };

  const makeUserRequest = async (
    agent: supertest.SuperAgentTest,
    cookies: Record<string, string>
  ) =>
    agent.post(`/graphql`).set(cookies).send({
      operationName: "GetCurrentUser",
      query: `
          query GetCurrentUser {
            currentUser {
              id
            }
          }
        `
    });

  const makeSuspendRequest = async (
    agent: supertest.SuperAgentTest,
    userId: string,
    isSuspended: boolean,
    cookies: Record<string, string>
  ) =>
    agent.post(`/graphql`).set(cookies).send({
      operationName: "SetUserSuspended",
      variables: {
        userId,
        isSuspended
      },
      query: `
        mutation SetUserSuspended($userId: String!, $isSuspended: Boolean!) {
          setUserSuspended(userId: $userId, isSuspended: $isSuspended) {
            id
            isSuspended
          }
        }
      `
    });

  const makeClearSessionsRequest = async (
    agent: supertest.SuperAgentTest,
    userId: string,
    cookies: Record<string, string>
  ) =>
    agent.post(`/graphql`).set(cookies).send({
      operationName: "ClearUserSessions",
      variables: { userId },
      query: `
        mutation ClearUserSessions($userId: String!) {
          clearUserSessions(userId: $userId) {
            id
          }
        }
      `
    });

  it("can clear user sessions", async () => {
    await withClient(pool, async (client) => {
      const ctx = await setUpSessionTest(client);
      // Clearing sessions
      const activeRes = await makeUserRequest(texterAgent, ctx.texterCookies);
      expect(activeRes.ok).toBeTruthy();
      expect(activeRes.body).not.toHaveProperty("errors");
      expect(activeRes.body).toHaveProperty("data");
      expect(activeRes.body.data.currentUser.id).toBe(ctx.texterId);

      const clearRes = await makeClearSessionsRequest(
        superadminAgent,
        ctx.texterId,
        ctx.superadminCookies
      );
      expect(clearRes.ok).toBeTruthy();
      expect(clearRes.body.data.clearUserSessions.id).toBe(ctx.texterId);

      const clearedRes = await makeUserRequest(texterAgent, ctx.texterCookies);
      expect(clearedRes.ok).toBeTruthy();
      expect(clearedRes.body.data.currentUser).toBeNull();

      const loginRes = await texterAgent.post("/login-callback").send({
        authType: "login",
        email: ctx.texter.email,
        password: ctx.password
      });
      expect(loginRes.statusCode).toBe(302);
      expect(loginRes.headers.location).toBe("/");
    });
  });

  it("can suspend a user", async () => {
    await withClient(pool, async (client) => {
      const ctx = await setUpSessionTest(client);
      // Suspending user
      const suspendRes = await makeSuspendRequest(
        superadminAgent,
        ctx.texterId,
        true,
        ctx.superadminCookies
      );
      expect(suspendRes.ok).toBeTruthy();
      expect(suspendRes.body.data.setUserSuspended.id).toBe(ctx.texterId);
      expect(suspendRes.body.data.setUserSuspended.isSuspended).toBe(true);

      const suspendedLoginRes = await texterAgent.post("/login-callback").send({
        authType: "login",
        email: ctx.texter.email,
        password: ctx.password,
        log: true
      });
      expect(suspendedLoginRes.ok).not.toBeTruthy();
      expect(suspendedLoginRes.body.success).toBe(false);
      expect(suspendedLoginRes.body.message).toMatch(/suspended/);
    });
  });
});
