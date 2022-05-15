import passport from "@passport-next/passport";
import passportSlack from "@rewired/passport-slack";
import type { Response } from "express";
import express from "express";

import { config } from "../../config";
import logger from "../../logger";
import { contextForRequest } from "../contexts";
import { botClient } from "../lib/slack";
import { getUserByAuth0Id, userLoggedIn } from "../models/cacheable_queries";
import type { SpokeRequest } from "../types";
import { errToObj } from "../utils";
import type { PassportCallback } from "./util";
import { handleSuspendedUser, redirectPostSignIn } from "./util";

const {
  BASE_URL,
  SLACK_TEAM_NAME,
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  SLACK_SCOPES,
  SLACK_CONVERT_EXISTING
} = config;

export function setupSlackPassport() {
  const options = {
    clientID: SLACK_CLIENT_ID,
    clientSecret: SLACK_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/login-callback`,
    authorizationURL: SLACK_TEAM_NAME
      ? `https://${SLACK_TEAM_NAME}.slack.com/oauth/authorize`
      : undefined
  };

  const strategy = new passportSlack.Strategy(
    options,
    async (
      accessToken: string,
      scopes: string[],
      team: string,
      // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
      { bot, incomingWebhook }: { bot: string; incomingWebhook: string },
      // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
      { user, team: teamProfile }: { user: any; team: any },
      done: PassportCallback
    ) => {
      // scopes is a Set
      if (config.SLACK_TOKEN) {
        try {
          const response = await botClient.users.profile.get({ user: user.id });
          const userProfile = response.profile as any;
          const { real_name, first_name, last_name, phone } = userProfile;
          user = { ...user, real_name, first_name, last_name, phone };
        } catch (err) {
          logger.error("Error fetching Slack profile: ", errToObj(err));
        }
      }

      return done(null, user);
    }
  );

  passport.use(strategy);

  passport.serializeUser(({ id: slackUserId }: { id: string }, done: any) => {
    getUserByAuth0Id({ auth0Id: slackUserId })
      .then((spokeUser) => done(null, spokeUser?.id))
      .catch((err) => done(err));
  });

  passport.deserializeUser((userId: any, done: any) =>
    userLoggedIn(userId, "id")
      .then((user: any) => done(null, user || false))
      .catch((error: any) => done(error))
  );

  const handleLogin = async (req: SpokeRequest, res: Response) => {
    const { db } = contextForRequest(req);
    const { user } = req;
    // set slack_id to auth0Id to avoid changing the schema
    const auth0Id = user && user.id;
    if (!auth0Id) {
      throw new Error("Null user in login callback");
    }
    let existingUser = await db
      .reader("user")
      .where({ auth0_id: auth0Id })
      .first()
      .catch((err) => {
        logger.error("Slack login error: could not find existing user: ", err);
        throw err;
      });

    if (!existingUser && SLACK_CONVERT_EXISTING) {
      const [existingEmailUser] = await db
        .primary("user")
        .update({ auth0_id: user.id })
        .where({ email: user.email })
        .returning("*");

      if (existingEmailUser) {
        existingUser = existingEmailUser;
      }
    }

    if (!existingUser) {
      let first_name;
      let last_name;
      const splitName = user.name ? user.name.split(" ") : ["First", "Last"];
      if (user.first_name && user.last_name) {
        // Spoke was granted the 'users.profile:read' scope so use Slack-provided first/last
        first_name = user.first_name;
        last_name = user.last_name;
      } else if (splitName.length === 1) {
        [first_name] = splitName;
        last_name = "";
      } else if (splitName.length === 2) {
        [first_name, last_name] = splitName;
      } else {
        [first_name] = splitName;
        last_name = splitName.slice(1, splitName.length + 1).join(" ");
      }

      const userData = {
        auth0_id: auth0Id,
        first_name,
        last_name,
        cell: user.phone || "unknown",
        email: user.email,
        is_superadmin: false
      };

      await db
        .primary("user")
        .insert(userData)
        .catch((err) => {
          logger.error("Slack login error: could not insert new user: ", err);
          throw err;
        });

      return redirectPostSignIn(req, res, true);
    }

    if (existingUser.is_suspended === true) {
      await handleSuspendedUser(req, res);
      return;
    }

    return redirectPostSignIn(req, res, false);
  };

  const app = express();
  app.get("/login", (req, res, next) => {
    // Cast as any to allow passing Slack options
    const passportOptions: any = {
      scope: SLACK_SCOPES.split(","),
      state: req.query.nextUrl
    };
    return passport.authenticate("slack", passportOptions)(req, res, next);
  });

  app.get(
    "/login-callback",
    passport.authenticate("slack", { failureRedirect: "/login" }),
    handleLogin
  );
  return app;
}

export default setupSlackPassport;
