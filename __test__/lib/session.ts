import type { PoolClient } from "pg";
import type { SuperAgentTest } from "supertest";

import { UserRoleType } from "../../src/api/organization-membership";
import type { CreateOrganizationOptions } from "../testbed-preparation/core";
import {
  createOrganization,
  createUser,
  createUserOrganization
} from "../testbed-preparation/core";

export interface CreateSessionOptions {
  agent: SuperAgentTest;
  email: string;
  password: string;
}

export const createSession = async (options: CreateSessionOptions) => {
  const { agent, email, password } = options;
  const sessionCookies = await agent
    .post("/login-callback")
    .send({ authType: "login", email, password })
    .then((res) => {
      const setCookies: string[] = res.headers["set-cookie"] ?? [];
      const cookies = setCookies.reduce<Record<string, string>>(
        (acc, cookie) => {
          const [cookieName, cookieValue] = cookie.split(";")[0].split("=");
          return {
            ...acc,
            [cookieName.replace("express:", "")]: cookieValue
          };
        },
        {}
      );
      return cookies;
    });
  return sessionCookies;
};

export interface CreateOrgAndSessionOptions {
  agent: SuperAgentTest;
  role: UserRoleType;
  orgOptions?: CreateOrganizationOptions;
}

export const createOrgAndSession = async (
  client: PoolClient,
  options: CreateOrgAndSessionOptions
) => {
  const { agent, role, orgOptions = {} } = options;
  const organization = await createOrganization(client, orgOptions);

  const password = "KeepItSecretKeepItSafe";
  const user = await createUser(client, {
    password,
    isSuperadmin: role === UserRoleType.SUPERADMIN
  });
  await createUserOrganization(client, {
    userId: user.id,
    organizationId: organization.id,
    role: role === UserRoleType.SUPERADMIN ? UserRoleType.OWNER : role
  });
  const cookies = await createSession({ agent, email: user.email, password });

  return { organization, user, cookies };
};
