// Must be first imports
import "react-hot-loader";

import { StyleSheet } from "aphrodite";
import React from "react";
import ReactDOM from "react-dom";
import Form from "react-formal";
import injectTapEventPlugin from "react-tap-event-plugin";

import GSDateField from "../components/forms/GSDateField";
import GSPasswordField from "../components/forms/GSPasswordField";
import GSScriptField from "../components/forms/GSScriptField";
import GSScriptOptionsField from "../components/forms/GSScriptOptionsField";
import GSSelectField from "../components/forms/GSSelectField";
import GSTextField from "../components/forms/GSTextField";
import App from "./App";
import { login, logout } from "./auth-service";

window.AuthService = {
  login,
  logout
};

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES);

Form.addInputTypes({
  string: GSTextField,
  number: GSTextField,
  date: GSDateField,
  email: GSTextField,
  script: GSScriptField,
  scriptoptions: GSScriptOptionsField,
  select: GSSelectField,
  password: GSPasswordField
});

// Needed for MaterialUI
injectTapEventPlugin();

ReactDOM.render(<App />, document.getElementById("mount"));
