import type {
  ComponentStyles,
  LayoutStyles,
  SpokeColors,
  TextStyles
} from "./types";

const colors: SpokeColors = {
  orange: "rgb(255, 102, 0)",
  lightGreen: "rgb(245, 255, 247)",
  blue: "rgb(20, 127, 215)",
  purple: "#5f2787",
  lightBlue: "rgb(196, 223, 245)",
  darkBlue: "rgb(13, 81, 139)",
  red: "rgb(245, 91, 91)",
  lightRed: "rgb(255, 141, 141)",
  darkRed: "rgb(237, 60, 57)",
  green: "rgb(83, 180, 119)",
  darkGreen: "rgb(24, 154, 52)",
  darkGray: "rgb(54, 67, 80)",
  gray: "rgb(153, 155, 158)",
  veryLightGray: "rgb(240, 242, 240)",
  lightGray: "rgb(225, 228, 224)",
  white: "rgb(255,255,255)",
  yellow: "rgb(250,190,40)",
  lightYellow: "rgb(252, 214, 120)"
};

const defaultFont = "Karla";

const text: TextStyles = {
  body: {
    color: colors.darkGray,
    fontSize: 14,
    fontFamily: defaultFont
  },
  link_light_bg: {
    fontWeight: 400,
    color: colors.green,
    textDecoration: "none",
    borderBottom: `1px solid ${colors.green}`,
    cursor: "pointer",
    ":hover": {
      borderBottom: 0,
      color: colors.orange
    },
    "a:visited": {
      fontWeight: 400,
      color: colors.darkGray,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  link_dark_bg: {
    fontWeight: 400,
    color: colors.white,
    textDecoration: "none",
    borderBottom: `1px solid ${colors.white}`,
    cursor: "pointer",
    ":hover": {
      borderBottom: 0,
      color: colors.orange
    },
    "a:visited": {
      fontWeight: 400,
      color: colors.veryLightGray,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  header: {
    color: colors.darkGray,
    fontSize: "1.5em",
    fontWeight: 400,
    fontFamily: defaultFont
  },
  secondaryHeader: {
    color: colors.darkGray,
    fontSize: "1.25em",
    fontFamily: defaultFont
  }
};

const layouts: LayoutStyles = {
  multiColumn: {
    container: {
      display: "flex",
      flexDirection: "row"
    },
    flexColumn: {
      display: "flex",
      flex: 1,
      flexDirection: "column"
    }
  },
  greenBox: {
    marginTop: "5vh",
    maxWidth: "80%",
    paddingBottom: "7vh",
    borderRadius: 8,
    paddingTop: "7vh",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center",
    color: colors.white
  }
};

const components: ComponentStyles = {
  floatingButton: {
    margin: 0,
    top: "auto",
    right: 20,
    bottom: 20,
    left: "auto",
    position: "fixed"
  },
  logoDiv: {
    margin: "50 auto",
    overflow: "hidden"
  },
  logoImg: {}
};

const theme = {
  colors,
  text,
  layouts,
  components
};

export default theme;
