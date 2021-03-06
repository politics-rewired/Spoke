import { MuiThemeProvider } from "@material-ui/core/styles";
import { css, StyleSheet } from "aphrodite";
import MuiThemeProviderv0 from "material-ui/styles/MuiThemeProvider";
import React, { useEffect, useState } from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter as Router, Route } from "react-router-dom";
import request from "superagent";
import { QueryParamProvider } from "use-query-params";

import ApolloClientSingleton from "../network/apollo-client-singleton";
import AppRoutes from "../routes";
import { createMuiThemev0, createMuiThemev1 } from "../styles/mui-theme";
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

  const muiTheme = createMuiThemev1(customTheme);
  const muiThemev0 = createMuiThemev0(customTheme);

  return (
    <SpokeContext.Provider value={{ theme: customTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <MuiThemeProviderv0 muiTheme={muiThemev0}>
          <ApolloProvider client={ApolloClientSingleton}>
            <div className={css(styles.root)}>
              <VersionNotifier />
              <Router>
                <QueryParamProvider ReactRouterRoute={Route}>
                  <AppRoutes />
                </QueryParamProvider>
              </Router>
            </div>
          </ApolloProvider>
        </MuiThemeProviderv0>
      </MuiThemeProvider>
    </SpokeContext.Provider>
  );
};

export default App;
