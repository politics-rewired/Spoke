import passport from "@passport-next/passport";
import express from "express";
import rateLimit from "express-rate-limit";
import { Strategy as LocalStrategy } from "passport-local";

import { config } from "../../config";
import { contextForRequest } from "../contexts";
import localAuthHelpers, {
  hashPassword,
  LocalAuthError,
  SuspendedUserError
} from "../local-auth-helpers";
import sendEmail from "../mail";
import { r } from "../models";
import { userLoggedIn } from "../models/cacheable_queries";
import type { SpokeRequest } from "../types";
import type { PassportCallback } from "./util";

export function setupLocalAuthPassport() {
  const strategy = new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true
    },
    async (
      req: SpokeRequest,
      username: string,
      password: string,
      done: PassportCallback
    ) => {
      const { db } = contextForRequest(req);
      const {
        nextUrl = "",
        authType
      }: { nextUrl: string; authType: string } = req.body;

      // eslint-disable-next-line no-useless-escape
      const uuidMatch = nextUrl.match(/\w{8}-(\w{4}\-){3}\w{12}/);

      const lowerCaseEmail = username.toLowerCase();
      const existingUser = await db
        .reader("user")
        .where({ email: lowerCaseEmail })
        .first();

      // Run login, signup, or reset functions based on request data
      if (authType && !localAuthHelpers[authType]) {
        return done(new LocalAuthError("Unknown auth type"));
      }

      try {
        const user = await localAuthHelpers[authType]({
          db,
          lowerCaseEmail,
          password,
          existingUser,
          nextUrl,
          uuidMatch,
          reqBody: req.body
        });
        if (user.is_suspended) {
          return done(new SuspendedUserError());
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  );
  passport.use(strategy);

  passport.serializeUser((user: any, done: any) => done(null, user.id));
  passport.deserializeUser((id: string, done: any) =>
    userLoggedIn(parseInt(id, 10))
      .then((user: any) => done(null, user || false))
      .catch((error: any) => done(error))
  );

  const app = express();

  app.post("/login-callback", (req, res, next) => {
    // See: http://www.passportjs.org/docs/authenticate/#custom-callback
    passport.authenticate("local", (err: any, user: any, _info: any) => {
      // Check custom property rather than using instanceof because errors are being passed as
      // objects, not classes
      if (err && err.errorType === "LocalAuthError") {
        return res.status(400).send({ success: false, message: err.message });
      }
      if (err) {
        // System error
        return next(err);
      }

      // Default behavior
      (<any>req).logIn(user, (logInErr: any) => {
        if (logInErr) {
          return next(logInErr);
        }
        return res.redirect(req.body.nextUrl || "/");
      });
    })(req, res, next);
  });

  const resetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5,
    skipSuccessfulRequests: true,
    message: "Too many reset password attempts, please try again after an hour"
  });

  app.post("/auth/request-reset", resetRateLimiter, async (req, res) => {
    // body should look like: { email }
    const { email } = req.body;
    if (email === undefined || email === null || email === "") {
      return res
        .status(400)
        .send("Error: no email provided with forgot password request");
    }

    const matchingUser = await r.reader("user").where({ email }).first("email");

    // If no matching user, send no email
    if (matchingUser) {
      const [resetRequest] = await r
        .knex("password_reset_request")
        .insert({ email })
        .returning("*");

      // Use owner of first org for replyTo
      const replyTo = config.EMAIL_REPLY_TO
        ? config.EMAIL_REPLY_TO
        : await r
            .reader("user")
            .join(
              "user_organization",
              "user_organization.user_id",
              "=",
              "user.id"
            )
            .join(
              "organization",
              "organization.id",
              "=",
              "user_organization.organization_id"
            )
            .where({ role: "OWNER" })
            .orderBy("organization.created_at", "asc")
            .first("email");

      await sendEmail({
        to: matchingUser.email,
        replyTo,
        subject: "Spoke Reset Password Request",
        text: `If you requested a password reset, you can reset your password at ${config.BASE_URL}/email-reset?token=${resetRequest.token} within the next 24 hours.\n\nIf you didn't, you can ignore this email.`
      });
    }

    return res.sendStatus(200);
  });

  app.post("/auth/claim-reset", resetRateLimiter, async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).send("Error: must provide token and new password");
    }

    const resetRequest = await r
      .knex("password_reset_request")
      .where({ token })
      .whereNull("used_at")
      .whereRaw(`expires_at > now()`)
      .first("*");

    if (resetRequest) {
      const newAuth0Id = await hashPassword(password);

      await r.knex.transaction(async (trx) => {
        await trx("password_reset_request")
          .update({ used_at: r.knex.fn.now() })
          .where({ id: resetRequest.id });
        await trx("user")
          .update({ auth0_id: newAuth0Id })
          .where({ email: resetRequest.email });
      });

      return res.sendStatus(200);
    }

    return res
      .status(400)
      .send(
        "Error: invalid password reset token. It may have expired or already been used."
      );
  });

  return app;
}

export default setupLocalAuthPassport;
