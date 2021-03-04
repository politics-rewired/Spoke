/* eslint-disable import/prefer-default-export */
import { darkBlack, grey400, grey500 } from "material-ui/styles/colors";
import getMuiTheme from "material-ui/styles/getMuiTheme";
import { fade } from "material-ui/utils/colorManipulator";

import baseTheme from "./theme";
import { CustomTheme } from "./types";

export const createMuiTheme = (overrides: Partial<CustomTheme> = {}) =>
  getMuiTheme(
    {
      fontFamily: "Poppins",
      palette: {
        primary1Color: overrides.primaryColor || baseTheme.colors.green,
        textColor: baseTheme.text.body.color,
        primary2Color: overrides.secondaryColor || baseTheme.colors.orange,
        primary3Color: grey400,
        accent1Color: overrides.secondaryColor || baseTheme.colors.orange,
        accent2Color: baseTheme.colors.lightGray,
        accent3Color: grey500,
        alternateTextColor: baseTheme.colors.white,
        canvasColor: baseTheme.colors.white,
        borderColor: baseTheme.colors.lightGray,
        disabledColor: fade(darkBlack, 0.3)
      }
    },
    { userAgent: "all" }
  );
