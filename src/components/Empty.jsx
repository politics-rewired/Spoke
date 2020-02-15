import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";

import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";

const inlineStyles = {
  icon: {
    position: "absolute",
    height: "100%",
    width: "100%",
    top: 0,
    left: 0,
    opacity: 0.2
  }
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    marginLeft: "20px",
    marginRight: "20px"
  },
  paddingBlock: {
    flexGrow: "1"
  },
  iconWrapper: {
    flexGrow: "10",
    position: "relative",
    maxHeight: "200px",
    overflow: "hidden"
  },
  title: {
    ...theme.text.header,
    opacity: 0.2,
    textAlign: "center"
  },
  content: {
    marginTop: "15px",
    textAlign: "center"
  }
});

const Empty = ({ title, icon, content }) => (
  <div className={css(styles.container)} {...dataTest("empty")}>
    <div className={css(styles.paddingBlock)} />
    <div className={css(styles.iconWrapper)}>
      {React.cloneElement(icon, { style: inlineStyles.icon })}
    </div>
    <div className={css(styles.title)}>{title}</div>
    {content && <div className={css(styles.content)}>{content}</div>}
    <div className={css(styles.paddingBlock)} />
  </div>
);

Empty.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
  content: PropTypes.object
};

export default Empty;
