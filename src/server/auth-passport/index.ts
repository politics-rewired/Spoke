import type { UserRecord } from "../api/types";
import { setupAuth0Passport } from "./auth0";
import { setupLocalAuthPassport } from "./local";
import { setupSlackPassport } from "./slack";

// Convert a Spoke user record to the type expected by passport.(de)serializeUser
export const sessionUserMap = {
  local: (user: UserRecord) => ({ id: user.id }),
  auth0: (user: UserRecord) => ({ id: user.auth0_id }),
  slack: (user: UserRecord) => ({ id: user.auth0_id })
};

export const passportSetups = {
  local: setupLocalAuthPassport,
  auth0: setupAuth0Passport,
  slack: setupSlackPassport
};

export default passportSetups;
