import express from "express";
import passport from "passport";
import Auth0Strategy from "passport-auth0";
import passportSlack from "@aoberoi/passport-slack";
import { Strategy as LocalStrategy } from "passport-local";

import { config } from "../config";
import logger from "../logger";
import { r } from "./models";
import { userLoggedIn } from "./models/cacheable_queries";
import localAuthHelpers, { LocalAuthError } from "./local-auth-helpers";
import { capitalizeWord } from "./api/lib/utils";

const {
  BASE_URL,
  AUTOJOIN_ORG_UUID,
  SLACK_TEAM_NAME,
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  SLACK_SCOPES,
  SLACK_CONVERT_EXISTING,
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET
} = config;

const SHOULD_AUTOJOIN_NEW_USER = !!AUTOJOIN_ORG_UUID;
const AUTOJOIN_URL = SHOULD_AUTOJOIN_NEW_USER
  ? `${BASE_URL}/${AUTOJOIN_ORG_UUID}/join`
  : "";

function redirectPostSignIn(req, res, isNewUser) {
  const redirectDestionation = !req.query.state
    ? SHOULD_AUTOJOIN_NEW_USER && isNewUser
      ? AUTOJOIN_URL
      : "/"
    : req.query.state
      ? req.query.state
      : "/";

  return res.redirect(redirectDestionation);
}

function setupSlackPassport() {
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
    (
      accessToken,
      scopes,
      team,
      { bot, incomingWebhook },
      { user: userProfile, team: teamProfile },
      done
    ) => done(null, userProfile)
  );

  passport.use(strategy);

  passport.serializeUser(({ id: slackUserId }, done) =>
    done(null, slackUserId)
  );

  passport.deserializeUser((slackUserId, done) =>
    userLoggedIn(slackUserId, "auth0_id")
      .then(user => done(null, user || false))
      .catch(error => done(error))
  );

  const handleLogin = async (req, res) => {
    const user = req.user;
    // set slack_id to auth0Id to avoid changing the schema
    const auth0Id = user && user.id;
    if (!auth0Id) {
      throw new Error("Null user in login callback");
    }
    let existingUser = await r
      .reader("user")
      .where({ auth0_id: auth0Id })
      .first()
      .catch(err => {
        logger.error("Slack login error: could not find existing user: ", err);
        throw err;
      });

    if (!existingUser && SLACK_CONVERT_EXISTING) {
      const [existingEmailUser] = await r
        .knex("user")
        .update({ auth0_id: user.id })
        .where({ email: user.email })
        .returning("*");

      if (existingEmailUser) {
        existingUser = existingEmailUser;
      }
    }

    if (!existingUser) {
      let first_name, last_name;
      const splitName = user.name ? user.name.split(" ") : ["First", "Last"];
      if (splitName.length == 1) {
        first_name = splitName[0];
        last_name = "";
      } else if (splitName.length == 2) {
        first_name = splitName[0];
        last_name = splitName[1];
      } else {
        first_name = splitName[0];
        last_name = splitName.slice(1, splitName.length + 1).join(" ");
      }

      const userData = {
        auth0_id: auth0Id,
        first_name,
        last_name,
        cell: "unknown",
        email: user.email,
        is_superadmin: false
      };

      await r
        .knex("user")
        .insert(userData)
        .catch(err => {
          logger.error("Slack login error: could not insert new user: ", err);
          throw err;
        });

      return redirectPostSignIn(req, res, true);
    }

    return redirectPostSignIn(req, res);
  };

  const app = express();
  app.get(
    "/login",
    passport.authenticate("slack", {
      scope: SLACK_SCOPES.split(",")
    })
  );

  app.get(
    "/login-callback",
    passport.authenticate("slack", { failureRedirect: "/login" }),
    handleLogin
  );
  return app;
}

function setupAuth0Passport() {
  const strategy = new Auth0Strategy(
    {
      domain: AUTH0_DOMAIN,
      clientID: AUTH0_CLIENT_ID,
      clientSecret: AUTH0_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/login-callback`
    },
    (accessToken, refreshToken, extraParams, profile, done) =>
      done(null, profile)
  );

  passport.use(strategy);

  passport.serializeUser((auth0User, done) => {
    // This is the Auth0 user object, not the db one
    // eslint-disable-next-line no-underscore-dangle
    const auth0Id = auth0User.id || auth0User._json.sub;
    done(null, auth0Id);
  });

  passport.deserializeUser((auth0Id, done) =>
    userLoggedIn(auth0Id, "auth0_id")
      .then(user => done(null, user || false))
      .catch(error => done(error))
  );

  const handleLogin = async (req, res) => {
    const auth0Id = req.user && (req.user.id || req.user._json.sub);
    if (!auth0Id) {
      throw new Error("Null user in login callback");
    }

    const existingUser = await r
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

      await r.knex("user").insert(userData);

      return redirectPostSignIn(req, res, true);
    }

    return redirectPostSignIn(req, res);
  };

  const app = express();
  app.get(
    "/login-callback",
    passport.authenticate("auth0", { failureRedirect: "/login" }),
    handleLogin
  );
  return app;
}

function setupLocalAuthPassport() {
  const strategy = new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true
    },
    async (req, username, password, done) => {
      const { nextUrl = "", authType } = req.body;
      const uuidMatch = nextUrl.match(/\w{8}-(\w{4}\-){3}\w{12}/);
      const lowerCaseEmail = username.toLowerCase();
      const existingUser = await r
        .reader("user")
        .where({ email: lowerCaseEmail })
        .first();

      // Run login, signup, or reset functions based on request data
      if (authType && !localAuthHelpers[authType]) {
        return done(new LocalAuthError("Unknown auth type"));
      }

      try {
        const user = await localAuthHelpers[authType]({
          lowerCaseEmail,
          password,
          existingUser,
          nextUrl,
          uuidMatch,
          reqBody: req.body
        });
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  );
  passport.use(strategy);

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) =>
    userLoggedIn(parseInt(id, 10))
      .then(user => done(null, user || false))
      .catch(error => done(error))
  );

  const app = express();
  app.post("/login-callback", (req, res, next) => {
    // See: http://www.passportjs.org/docs/authenticate/#custom-callback
    passport.authenticate("local", (err, user, info) => {
      // Check custom property rather than using instanceof because errors are being passed as
      // objects, not classes
      if (err && err.errorType === "LocalAuthError") {
        return res.status(400).send({ success: false, message: err.message });
      } else if (err) {
        // System error
        return next(err);
      }

      // Default behavior
      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        }
        return res.redirect(req.body.nextUrl || "/");
      });
    })(req, res, next);
  });

  return app;
}

export default {
  local: setupLocalAuthPassport,
  auth0: setupAuth0Passport,
  slack: setupSlackPassport
};
