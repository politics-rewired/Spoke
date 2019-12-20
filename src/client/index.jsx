import React from "react";
import ReactDOM from "react-dom";
import { Router, browserHistory } from "react-router";
import { syncHistoryWithStore } from "react-router-redux";
import { StyleSheet } from "aphrodite";
import makeRoutes from "../routes";
import Store from "../store";
import { ApolloProvider } from "react-apollo";
import ApolloClientSingleton from "../network/apollo-client-singleton";
import { login, logout } from "./auth-service";

window.AuthService = {
  login,
  logout
};

const store = new Store(browserHistory, window.INITIAL_STATE);
const history = syncHistoryWithStore(browserHistory, store.data);

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES);

const authCheck = (nextState, replace) => {
  // TODO: check cookies here?
};

ReactDOM.render(
  <ApolloProvider store={store.data} client={ApolloClientSingleton}>
    <Router history={history} routes={makeRoutes(authCheck)} />
  </ApolloProvider>,
  document.getElementById("mount")
);
