import { ApolloProvider } from "@apollo/client";
import { LicenseInfo } from "@mui/x-license-pro";
import { css, StyleSheet } from "aphrodite";
import React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";

import ApolloClientSingleton from "../network/apollo-client-singleton";
import AppRoutes from "../routes";
import { SpokeThemeProvider } from "../styles/spoke-theme-context";
import baseTheme from "../styles/theme";
import ErrorHandler from "./ErrorHandler";
import { SpokeContextProvider } from "./spoke-context";
import VersionNotifier from "./VersionNotifier";

LicenseInfo.setLicenseKey(window.MUI_PRO_KEY);

const styles = StyleSheet.create({
  root: {
    ...baseTheme.text.body,
    height: "100%"
  }
});

const App: React.FC = () => {
  return (
    <ApolloProvider client={ApolloClientSingleton}>
      <BrowserRouter>
        <QueryParamProvider ReactRouterRoute={Route}>
          <SpokeContextProvider>
            <SpokeThemeProvider>
              <div className={css(styles.root)}>
                <VersionNotifier />
                <ErrorHandler />
                <AppRoutes />
              </div>
            </SpokeThemeProvider>
          </SpokeContextProvider>
        </QueryParamProvider>
      </BrowserRouter>
    </ApolloProvider>
  );
};

export default App;
