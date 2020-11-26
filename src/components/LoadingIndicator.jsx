import { css, StyleSheet } from "aphrodite";
import CircularProgress from "material-ui/CircularProgress";
import React from "react";

const styles = StyleSheet.create({
  loader: {
    marginRight: "auto",
    marginLeft: "auto",
    marginTop: 50,
    textAlign: "center"
  }
});

export default () => (
  <div className={css(styles.loader)}>
    <CircularProgress />
  </div>
);
