import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "./ClassRouter";

import theme from "../styles/theme";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container
  },
  content: {
    ...theme.layouts.multiColumn.flexColumn,
    paddingLeft: "2rem",
    paddingRight: "2rem",
    margin: "24px auto"
  }
});

const TexterDashboard = (props) => {
  const {
    main: MainComponent,
    topNav: TopNavComponent,
    fullScreen: FullScreenComponent,
    ...rest
  } = props;

  if (FullScreenComponent) {
    return <FullScreenComponent {...rest} />;
  }
  return (
    <div>
      {TopNavComponent && <TopNavComponent {...rest} />}
      <div className={css(styles.container)}>
        <div className={css(styles.content)}>
          <MainComponent {...rest} />
        </div>
      </div>
    </div>
  );
};

TexterDashboard.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  children: PropTypes.object,
  main: PropTypes.elementType,
  topNav: PropTypes.elementType,
  fullScreen: PropTypes.elementType
};

export default withRouter(TexterDashboard);
