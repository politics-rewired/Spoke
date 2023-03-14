import IconButton from "@material-ui/core/IconButton";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React, { Component } from "react";

const INTERNAL_ARROW_PADDING = 11;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: -INTERNAL_ARROW_PADDING,
    top: -INTERNAL_ARROW_PADDING,
    padding: 0
  },
  icon: {
    color: "rgb(83, 180, 119)",
    width: 40,
    height: 40
  },
  arrowButton: {
    "@media(min-width: 450px)": {
      display: "none !important"
    },
    "@media(max-width: 450px)": {
      display: "block !important"
    },
    padding: 0 // Override the built-in IconButton padding.
  }
});
class SendButtonArrow extends Component {
  handleTouchTap = () => {
    const { onFinalTouchTap } = this.props;
    return onFinalTouchTap();
  };

  render() {
    return (
      <div className={css(styles.container)}>
        <IconButton
          className={css(styles.arrowButton)}
          onClick={this.handleTouchTap}
          disabled={this.props.disabled}
        >
          <ArrowForwardIcon className={css(styles.icon)} />
        </IconButton>
      </div>
    );
  }
}

SendButtonArrow.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default SendButtonArrow;
