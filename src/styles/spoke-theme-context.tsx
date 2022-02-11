import { MuiThemeProvider } from "@material-ui/core/styles";
import MuiThemeProviderv0 from "material-ui/styles/MuiThemeProvider";
import React, { useContext, useEffect, useState } from "react";
import request from "superagent";

import { createMuiThemev0, createMuiThemev1 } from "./mui-theme";
import { CustomTheme } from "./types";

export const SpokeThemeContext = React.createContext<CustomTheme>({});

export const SpokeThemeProvider: React.FC = (props) => {
  const [customTheme, setCustomTheme] = useState<CustomTheme>({});

  useEffect(() => {
    request.get("/settings/theme").then(({ body }) => {
      setCustomTheme(body);
    });
  }, []);

  const muiTheme = createMuiThemev1(customTheme);
  const muiThemev0 = createMuiThemev0(customTheme);

  return (
    <SpokeThemeContext.Provider value={customTheme}>
      <MuiThemeProvider theme={muiTheme}>
        <MuiThemeProviderv0 muiTheme={muiThemev0}>
          {props.children}
        </MuiThemeProviderv0>
      </MuiThemeProvider>
    </SpokeThemeContext.Provider>
  );
};

export const useSpokeTheme = () => useContext(SpokeThemeContext);

export const withSpokeTheme = <P extends unknown>(
  Component: React.ComponentType<P & { theme: CustomTheme }>
) => {
  const ComponentWithSpokeTheme: React.FC<P> = (props) => {
    const theme = useSpokeTheme();
    return <Component {...props} theme={theme} />;
  };

  return ComponentWithSpokeTheme;
};

export default SpokeThemeContext;
