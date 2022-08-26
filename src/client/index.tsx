import { StyleSheet } from "aphrodite";
import React from "react";
import ReactDOM from "react-dom";
import request from "superagent";

import App from "./App";
import { createAuthService } from "./auth-service";
import type { InstanceSettings } from "./spoke-context";

const main = (settings: InstanceSettings) => {
  window.AuthService = createAuthService(settings);

  StyleSheet.rehydrate(settings.RENDERED_CLASS_NAMES ?? []);

  ReactDOM.render(<App />, document.getElementById("mount"));
};

request.get("/settings/instance").then(({ body: settings }) => main(settings));
