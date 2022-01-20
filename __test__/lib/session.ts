import { SuperAgentTest } from "supertest";

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
      const setCookies: string[] = res.headers["set-cookie"];
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
