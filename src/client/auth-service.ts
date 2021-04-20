/* eslint-disable import/prefer-default-export */
import auth0 from "auth0-js";

import { InstanceSettings } from "./spoke-context";

export const createAuthService = (settings: InstanceSettings) => ({
  login: (nextUrl?: string) => {
    const webAuth = new auth0.WebAuth({
      domain: settings.AUTH0_DOMAIN,
      clientID: settings.AUTH0_CLIENT_ID,
      redirectUri: `${settings.BASE_URL}/login-callback`,
      responseType: "code",
      state: nextUrl || "/",
      scope: "openid profile email"
    });

    webAuth.authorize();
  },
  logout: () => {
    const webAuth = new auth0.WebAuth({
      domain: settings.AUTH0_DOMAIN,
      clientID: settings.AUTH0_CLIENT_ID
    });

    webAuth.logout({
      returnTo: `${settings.BASE_URL}/logout-callback`,
      client_id: settings.AUTH0_CLIENT_ID
    });
  }
});
