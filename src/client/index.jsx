import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { StyleSheet } from "aphrodite";
import AppRoutes from "../routes";
import { ApolloProvider } from "react-apollo";
import ApolloClientSingleton from "../network/apollo-client-singleton";
import { login, logout } from "./auth-service";

window.AuthService = {
  login,
  logout
};

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES);

ReactDOM.render(
  <ApolloProvider client={ApolloClientSingleton}>
    <Router>
      <AppRoutes />
    </Router>
  </ApolloProvider>,
  document.getElementById("mount")
);

module.hot.accept();
