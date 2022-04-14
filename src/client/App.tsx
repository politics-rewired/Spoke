import { ApolloProvider } from "@apollo/client";
import { css, StyleSheet } from "aphrodite";
import React from "react";
import { BrowserRouter, Route } from "react-router-dom";

import ApolloClientSingleton from "../network/apollo-client-singleton";
import AppRoutes from "../routes";
import { SpokeThemeProvider } from "../styles/spoke-theme-context";
import baseTheme from "../styles/theme";
import { SpokeContextProvider } from "./spoke-context";
import VersionNotifier from "./VersionNotifier";

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
        <SpokeContextProvider>
          <SpokeThemeProvider>
            <div className={css(styles.root)}>
              <VersionNotifier />
              <AppRoutes />
            </div>
          </SpokeThemeProvider>
        </SpokeContextProvider>
      </BrowserRouter>
    </ApolloProvider>
  );
};

export default App;
