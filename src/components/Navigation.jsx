import { css, StyleSheet } from "aphrodite";
import camelCase from "lodash/camelCase";
import { FlatButton } from "material-ui";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import { List, ListItem } from "material-ui/List";
import Paper from "material-ui/Paper";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router-dom";

import { dataTest } from "../lib/attributes";

const styles = StyleSheet.create({
  sideBarWithMenu: {
    width: 256,
    height: "100%",
    writingMode: "hoizontal-lr"
  },
  sideBarWithoutMenu: {
    writingMode: "vertical-rl",
    padding: "5px",
    paddingTop: "20px"
  }
});

const Navigation = function Navigation(props) {
  const { sections, switchListItem } = props;

  if (props.showMenu) {
    return (
      <div className={css(styles.sideBarWithMenu)}>
        <Paper
          rounded={false}
          zDepth={2}
          style={{
            height: "100%"
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <FlatButton label="Close Menu" onClick={props.onToggleMenu} />
          </div>
          <List>
            {sections.map((section) => (
              <ListItem
                {...dataTest(camelCase(`nav ${section.path}`))}
                key={section.name}
                primaryText={section.name}
                onClick={() => props.history.push(section.url)}
                rightAvatar={
                  section.badge && (
                    <Avatar backgroundColor="#FFAA00" size={30}>
                      {section.badge.count}
                    </Avatar>
                  )
                }
              />
            ))}
            <Divider />
            {switchListItem}
          </List>
        </Paper>
      </div>
    );
  }
  return (
    <div
      className={css(styles.sideBarWithoutMenu)}
      onClick={props.onToggleMenu}
    >
      <span style={{ cursor: "pointer" }}>SHOW MENU</span>
    </div>
  );
};

Navigation.defaultProps = {
  showMenu: true
};

Navigation.propTypes = {
  sections: PropTypes.array,
  switchListItem: PropTypes.object,
  history: PropTypes.object.isRequired,
  onToggleMenu: PropTypes.func.isRequired,
  showMenu: PropTypes.bool
};

export default withRouter(Navigation);
