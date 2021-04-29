import { StyleSheet } from "aphrodite";

import theme from "../../../../../styles/theme";

const rowStyles = StyleSheet.create({
  removeButton: {
    width: 50
  },
  texterRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },
  nameColumn: {
    width: 100,
    textOverflow: "ellipsis",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  slider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  leftSlider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  assignedCount: {
    width: 40,
    fontSize: 16,
    paddingLeft: 5,
    paddingRight: 5,
    textAlign: "center",
    marginTop: "auto",
    marginBottom: "auto",
    marginRight: 10,
    display: "inline-block",
    backgroundColor: theme.colors.lightGray
  },
  input: {
    width: 50,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 10,
    marginTop: "auto",
    marginBottom: "auto",
    display: "inline-block"
  }
});

export default rowStyles;
