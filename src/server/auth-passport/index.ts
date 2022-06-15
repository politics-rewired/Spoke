import { setupAuth0Passport } from "./auth0";
import { setupLocalAuthPassport } from "./local";
import { setupSlackPassport } from "./slack";

export const passportSetups = {
  local: setupLocalAuthPassport,
  auth0: setupAuth0Passport,
  slack: setupSlackPassport
};

export default passportSetups;
