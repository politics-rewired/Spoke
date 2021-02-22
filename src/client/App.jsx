import { css, StyleSheet } from "aphrodite";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter as Router } from "react-router-dom";

import ApolloClientSingleton from "../network/apollo-client-singleton";
import AppRoutes from "../routes";
import muiTheme from "../styles/mui-theme";
import theme from "../styles/theme";
import VersionNotifier from "./VersionNotifier";

const styles = StyleSheet.create({
  root: {
    ...theme.text.body,
    height: "100%"
  }
});

const App = () => (
  <ApolloProvider client={ApolloClientSingleton}>
    <MuiThemeProvider muiTheme={muiTheme}>
      <div className={css(styles.root)}>
        <VersionNotifier />
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </MuiThemeProvider>
  </ApolloProvider>
);

export default App;
