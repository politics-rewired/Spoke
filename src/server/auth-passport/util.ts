import type { NextFunction, Request, Response } from "express";

import { config } from "../../config";
import type { UserRecord } from "../api/types";
import { SuspendedUserError } from "../local-auth-helpers";

export type PassportCallback = (err: Error | null, result?: any) => void;

export type UserWithStatus = UserRecord & { isNew?: boolean };

const { BASE_URL, AUTOJOIN_ORG_UUID } = config;

const SHOULD_AUTOJOIN_NEW_USER = !!AUTOJOIN_ORG_UUID;
const AUTOJOIN_URL = SHOULD_AUTOJOIN_NEW_USER
  ? `${BASE_URL}/${AUTOJOIN_ORG_UUID}/join`
  : "";

export function redirectPostSignIn(
  req: Request,
  res: Response,
  isNewUser: boolean
) {
  const redirectDestionation = !req.query.state
    ? SHOULD_AUTOJOIN_NEW_USER && isNewUser
      ? AUTOJOIN_URL
      : "/"
    : req.query.state
    ? req.query.state
    : "/";

  return res.redirect(redirectDestionation);
}

export async function handleSuspendedUser(req: Request, res: Response) {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
  return res
    .status(400)
    .send({ success: false, message: new SuspendedUserError().message });
}

export const passportCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => (err: unknown, user: UserWithStatus, _info: unknown) => {
  if (err) {
    return next(err);
  }
  if (!user) {
    return res.redirect("/login");
  }
  if (user.is_suspended === true) {
    return handleSuspendedUser(req, res);
  }
  req.logIn(user, (loginErr: unknown) => {
    if (loginErr) {
      return next(loginErr);
    }
    return redirectPostSignIn(req, res, user.isNew === true);
  });
};
