import { StyleSheet } from "aphrodite";
import React from "react";
import ReactDOM from "react-dom";
import request from "superagent";

import App from "./App";
import { createAuthService } from "./auth-service";
import reportWebVitals from "./reportWebVitals";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import type { InstanceSettings } from "./spoke-context";

const main = (settings: InstanceSettings) => {
  window.AuthService = createAuthService(settings);

  StyleSheet.rehydrate(settings.RENDERED_CLASS_NAMES ?? []);

  ReactDOM.render(<App />, document.getElementById("mount"));
};

request.get("/settings/instance").then(({ body: settings }) => main(settings));

// Register service worker
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
