// Must be first imports
// eslint-disable-next-line import/no-extraneous-dependencies
import "react-hot-loader";

import { StyleSheet } from "aphrodite";
import React from "react";
import ReactDOM from "react-dom";

import App from "./App";
import { login, logout } from "./auth-service";

window.AuthService = {
  login,
  logout
};

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES);

ReactDOM.render(<App />, document.getElementById("mount"));
