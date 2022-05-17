import passport from "@passport-next/passport";
import express from "express";
import Auth0Strategy from "passport-auth0";

import { config } from "../../config";
import logger from "../../logger";
import { capitalizeWord } from "../api/lib/utils";
import { contextForRequest } from "../contexts";
import type { SpokeRequest } from "../types";
import type { PassportCallback, UserWithStatus } from "./util";
import { passportCallback } from "./util";

const { BASE_URL, AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = config;

export function setupAuth0Passport() {
  const strategy = new Auth0Strategy(
    {
      domain: AUTH0_DOMAIN,
      clientID: AUTH0_CLIENT_ID,
      clientSecret: AUTH0_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/login-callback`,
      passReqToCallback: true
    },
    async (
      req: SpokeRequest,
      accessToken: string,
      refreshToken: string,
      extraParams: Record<string, unknown>,
      auth0User: any,
      done: PassportCallback
    ) => {
      const auth0Id = auth0User.id ?? auth0User._json.sub;
      if (!auth0Id) {
        return done(new Error("Null user in Auth0 login callback"));
      }

      const { db } = contextForRequest(req);

      // Attempt login
      try {
        const spokeUser = await db
          .reader("user")
          .where({ auth0_id: auth0Id })
          .first();
        if (spokeUser) {
          return done(null, spokeUser);
        }
      } catch (err: any) {
        logger.error("Auth0 login error: could not find existing user: ", err);
        return done(err);
      }

      // eslint-disable-next-line no-underscore-dangle
      const userJson = req.user._json;
      const userMetadata =
        userJson["https://spoke/user_metadata"] || userJson.user_metadata || {};
      const userData = {
        auth0_id: auth0Id,
        first_name: capitalizeWord(userMetadata.given_name) || "",
        last_name: capitalizeWord(userMetadata.family_name) || "",
        cell: userMetadata.cell || "",
        email: userJson.email,
        is_superadmin: false
      };

      try {
        const spokeUser = await db
          .primary<UserWithStatus>("user")
          .insert(userData)
          .returning("*")
          .then(([user]) => ({ ...user, isNew: true }));
        return done(null, spokeUser);
      } catch (err: any) {
        logger.error("Error creating new Auth0 user: ", err);
        return done(err);
      }
    }
  );

  passport.use(strategy);

  const app = express();
  app.get("/login-callback", (req, res, next) => {
    const callback = passportCallback(req, res, next);
    return passport.authenticate("auth0", callback)(req, res, next);
  });
  return app;
}

export default setupAuth0Passport;
