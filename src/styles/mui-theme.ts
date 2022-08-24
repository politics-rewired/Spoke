import blue from "@material-ui/core/colors/blue";
import blueGrey from "@material-ui/core/colors/blueGrey";
import green from "@material-ui/core/colors/green";
import grey from "@material-ui/core/colors/grey";
import red from "@material-ui/core/colors/red";
import yellow from "@material-ui/core/colors/yellow";
import { createTheme } from "@material-ui/core/styles"; // v4.x
import getMuiTheme from "material-ui/styles/getMuiTheme";

import baseTheme from "./theme";
import { CustomTheme } from "./types";

export const createMuiThemev0 = (theme: Partial<CustomTheme> = {}) =>
  getMuiTheme(
    {
      fontFamily: "Poppins",
      palette: {
        primary1Color: theme.primaryColor || baseTheme.colors.green,
        textColor: theme.primaryTextColor || blueGrey[800],
        primary2Color: theme.secondaryColor || baseTheme.colors.orange,
        primary3Color: grey[400],
        accent1Color: theme.secondaryColor || baseTheme.colors.orange,
        accent2Color: grey[300],
        accent3Color: grey[500],
        alternateTextColor: theme.secondaryTextColor || grey[50],
        canvasColor: theme.canvassColor || grey[50],
        borderColor: grey[300],
        disabledColor: theme.disabledBackgroundColor || grey[300]
      }
    },
    { userAgent: "all" }
  );

// TODO: return real theme once components beyond Dialog are converted
export const createMuiThemev1 = (theme: Partial<CustomTheme> = {}) =>
  createTheme({
    palette: {
      primary: { main: theme.primaryColor || baseTheme.colors.green },
      secondary: { main: theme.secondaryColor || baseTheme.colors.green },
      badge: { main: theme.badgeColor || yellow[700] },
      success: { main: theme.successColor || green[500], light: green[100] },
      warning: { main: theme.warningColor || baseTheme.colors.orange },
      error: { main: theme.errorColor || red[200] },
      info: { main: theme.infoColor || blue[800], light: blue[100] },
      text: {
        primary: theme.primaryTextColor || blueGrey[800],
        // Do not provide default of grey[50] here -- v0 and v1 behave differently
        secondary: theme.secondaryTextColor
      },
      background: {
        default: theme.canvassColor || grey[50]
      },
      action: {
        disabled: theme.disabledTextColor || blueGrey[800],
        disabledBackground: theme.disabledBackgroundColor || grey[300]
      }
    }
  });
