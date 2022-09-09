import type { CSSProperties as AphroditeCSSProperties } from "aphrodite";
import type { MuiTheme } from "material-ui/styles";
import type { CSSProperties } from "react";

type CSSPropertiesNoColors = Omit<AphroditeCSSProperties, "backgroundColor">;

export interface SpokeColors {
  orange: string;
  lightGreen: string;
  blue: string;
  purple: string;
  lightBlue: string;
  darkBlue: string;
  red: string;
  lightRed: string;
  darkRed: string;
  green: string;
  darkGreen: string;
  darkGray: string;
  gray: string;
  veryLightGray: string;
  lightGray: string;
  white: string;
  yellow: string;
  lightYellow: string;
}

export interface TextStyles {
  body: CSSProperties;
  link_light_bg: AphroditeCSSProperties;
  link_dark_bg: AphroditeCSSProperties;
  header: AphroditeCSSProperties;
  secondaryHeader: CSSProperties;
}

export interface ComponentStyles {
  floatingButton: CSSProperties;
  logoDiv: CSSProperties;
  logoImg: CSSProperties;
}

export interface LayoutStyles {
  multiColumn: {
    container: CSSProperties;
    flexColumn: CSSProperties;
  };
  greenBox: CSSPropertiesNoColors;
}

export interface CustomTheme {
  canvassColor?: string;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  successColor?: string;
  infoColor?: string;
  warningColor?: string;
  errorColor?: string;
  badgeColor?: string;
  disabledTextColor?: string;
  disabledBackgroundColor?: string;
  defaultCampaignColor?: string;
  defaultCampaignLogo?: string;
  logoUrl?: string;
  firstMessageIconUrl?: string;
  welcomeText?: string;
}

export interface MuiThemeProviderProps {
  muiTheme?: MuiTheme;
}

// TODO: extend theme to support logo URLs
// declare module "@material-ui/core/styles/createMuiTheme" {
//   interface Theme {
//     status: {
//       danger: React.CSSProperties["color"];
//     };
//   }
//   interface ThemeOptions {
//     status: {
//       danger: React.CSSProperties["color"];
//     };
//   }
// }

declare module "@material-ui/core/styles/createPalette" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Palette {
    badge?: Palette["primary"];
    inboundMessageBg?: Palette["primary"];
    repliesBadge?: Palette["primary"];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PaletteOptions {
    badge?: PaletteOptions["primary"];
    inboundMessageBg?: PaletteOptions["primary"];
    repliesBadge?: PaletteOptions["primary"];
  }
}
