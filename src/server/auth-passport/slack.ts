import passport from "@passport-next/passport";
import passportSlack from "@rewired/passport-slack";
import express from "express";

import { config } from "../../config";
import logger from "../../logger";
import { contextForRequest } from "../contexts";
import { botClient } from "../lib/slack";
import type { SpokeRequest } from "../types";
import { errToObj } from "../utils";
import type { PassportCallback, UserWithStatus } from "./util";
import { passportCallback } from "./util";

const {
  BASE_URL,
  SLACK_TEAM_NAME,
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  SLACK_SCOPES,
  SLACK_CONVERT_EXISTING
} = config;

const namePartsFromSlack = (slackUser: any) => {
  let firstName;
  let lastName;
  const splitName = slackUser.name
    ? slackUser.name.split(" ")
    : ["First", "Last"];
  if (slackUser.first_name && slackUser.last_name) {
    // Spoke was granted the 'users.profile:read' scope so use Slack-provided first/last
    firstName = slackUser.first_name;
    lastName = slackUser.last_name;
  } else if (splitName.length === 1) {
    [firstName] = splitName;
    lastName = "";
  } else if (splitName.length === 2) {
    [firstName, lastName] = splitName;
  } else {
    [firstName] = splitName;
    lastName = splitName.slice(1, splitName.length + 1).join(" ");
  }

  return { firstName, lastName };
};

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
    { ...options, passReqToCallback: true },
    async (
      req: SpokeRequest,
      accessToken: string,
      scopes: string[],
      team: string,
      // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
      { bot, incomingWebhook }: { bot: string; incomingWebhook: string },
      // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
      { user: slackUser, team: teamProfile }: { user: any; team: any },
      done: PassportCallback
    ) => {
      // scopes is a Set
      if (config.SLACK_TOKEN) {
        try {
          const response = await botClient.users.profile.get({
            user: slackUser.id
          });
          const userProfile = response.profile as any;
          const { real_name, first_name, last_name, phone } = userProfile;
          slackUser = { ...slackUser, real_name, first_name, last_name, phone };
        } catch (err) {
          logger.error("Error fetching Slack profile: ", errToObj(err));
        }
      }

      const { db } = contextForRequest(req);

      try {
        const spokeUser = await db
          .reader<UserWithStatus>("user")
          .where({ auth0_id: slackUser.id })
          .first();
        if (spokeUser) {
          return done(null, spokeUser);
        }
      } catch (err: any) {
        logger.error("Slack login error: could not find existing user: ", err);
        return done(err);
      }

      if (SLACK_CONVERT_EXISTING) {
        try {
          const [spokeUser] = await db
            .primary("user")
            .update({ auth0_id: slackUser.id })
            .where({ email: slackUser.email })
            .returning("*");
          if (spokeUser) {
            return done(null, spokeUser);
          }
        } catch (err: any) {
          logger.error("Error converting existing Slack user: ", err);
          return done(err);
        }
      }

      const { firstName, lastName } = namePartsFromSlack(slackUser);
      const spokeUserData = {
        auth0_id: slackUser.id,
        first_name: firstName,
        last_name: lastName,
        cell: slackUser.phone || "unknown",
        email: slackUser.email,
        is_superadmin: false
      };

      try {
        const spokeUser = await db
          .primary<UserWithStatus>("user")
          .insert(spokeUserData)
          .returning("*")
          .then(([user]) => ({ ...user, isNew: true }))
          .catch((err) => {
            logger.error("Slack login error: could not insert new user: ", err);
            throw err;
          });
        return done(null, spokeUser);
      } catch (err: any) {
        logger.error("Error creating new Slack user: ", err);
        return done(err);
      }
    }
  );

  passport.use(strategy);

  const app = express();
  app.get("/login", (req, res, next) => {
    // Cast as any to allow passing Slack options
    const passportOptions: any = {
      scope: SLACK_SCOPES.split(","),
      state: req.query.nextUrl
    };
    return passport.authenticate("slack", passportOptions)(req, res, next);
  });

  app.get("/login-callback", (req, res, next) => {
    const callback = passportCallback(req, res, next);
    return passport.authenticate("slack", callback)(req, res, next);
  });
  return app;
}

export default setupSlackPassport;
