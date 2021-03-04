import { CSSProperties as AphroditeCSSProperties } from "aphrodite";
import { MuiTheme } from "material-ui/styles";
import { CSSProperties } from "react";

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
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  firstMessageIconUrl?: string;
  welcomeText?: string;
}

export interface MuiThemeProviderProps {
  muiTheme?: MuiTheme;
}
