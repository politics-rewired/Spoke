import { css, StyleSheet } from "aphrodite";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React, { useEffect, useState } from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter as Router } from "react-router-dom";
import request from "superagent";

import ApolloClientSingleton from "../network/apollo-client-singleton";
import AppRoutes from "../routes";
import { createMuiTheme } from "../styles/mui-theme";
import baseTheme from "../styles/theme";
import { CustomTheme } from "../styles/types";
import SpokeContext from "./spoke-context";
import VersionNotifier from "./VersionNotifier";

const styles = StyleSheet.create({
  root: {
    ...baseTheme.text.body,
    height: "100%"
  }
});

const App: React.FC = () => {
  const [customTheme, setTheme] = useState<CustomTheme>({});

  useEffect(() => {
    request.get("/settings/theme").then(({ body }) => {
      setTheme(body);
    });
  }, []);

  const muiTheme = createMuiTheme(customTheme);

  return (
    <SpokeContext.Provider value={{ theme: customTheme }}>
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
    </SpokeContext.Provider>
  );
};

export default App;
