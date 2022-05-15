import passport from "@passport-next/passport";
import type { Response } from "express";
import express from "express";
import Auth0Strategy from "passport-auth0";

import { config } from "../../config";
import { capitalizeWord } from "../api/lib/utils";
import { contextForRequest } from "../contexts";
import { userLoggedIn } from "../models/cacheable_queries";
import type { SpokeRequest } from "../types";
import type { PassportCallback } from "./util";
import { handleSuspendedUser, redirectPostSignIn } from "./util";

const { BASE_URL, AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = config;

export function setupAuth0Passport() {
  const strategy = new Auth0Strategy(
    {
      domain: AUTH0_DOMAIN,
      clientID: AUTH0_CLIENT_ID,
      clientSecret: AUTH0_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/login-callback`
    },
    (
      accessToken: string,
      refreshToken: string,
      extraParams: Record<string, unknown>,
      profile: any,
      done: PassportCallback
    ) => done(null, profile)
  );

  passport.use(strategy);

  passport.serializeUser((auth0User: any, done: any) => {
    // This is the Auth0 user object, not the db one
    // eslint-disable-next-line no-underscore-dangle
    const auth0Id = auth0User.id || auth0User._json.sub;
    done(null, auth0Id);
  });

  passport.deserializeUser((auth0Id: string, done: any) =>
    userLoggedIn(auth0Id, "auth0_id")
      .then((user: any) => done(null, user || false))
      .catch((error: any) => done(error))
  );

  const handleLogin = async (req: SpokeRequest, res: Response) => {
    const { db } = contextForRequest(req);
    const auth0Id = req.user && (req.user.id || req.user._json.sub);
    if (!auth0Id) {
      throw new Error("Null user in login callback");
    }

    const existingUser = await db
      .reader("user")
      .where({ auth0_id: auth0Id })
      .first();

    if (!existingUser) {
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

      await db.primary("user").insert(userData);

      return redirectPostSignIn(req, res, true);
    }

    if (existingUser.is_suspended) {
      await handleSuspendedUser(req, res);
      return;
    }

    return redirectPostSignIn(req, res, false);
  };

  const app = express();
  app.get(
    "/login-callback",
    passport.authenticate("auth0", { failureRedirect: "/login" }),
    handleLogin
  );
  return app;
}

export default setupAuth0Passport;
