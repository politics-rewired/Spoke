import type { Request, Response } from "express";

import { config } from "../../config";
import { SuspendedUserError } from "../local-auth-helpers";

export type PassportCallback = (err: Error | null, result?: any) => void;

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
