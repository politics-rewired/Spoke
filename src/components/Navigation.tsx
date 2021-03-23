import { useTheme } from "@material-ui/core/styles";
import { css, StyleSheet } from "aphrodite";
import camelCase from "lodash/camelCase";
import { FlatButton } from "material-ui";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import { List, ListItem } from "material-ui/List";
import Paper from "material-ui/Paper";
import React from "react";
import { useHistory } from "react-router-dom";

import { dataTest } from "../lib/attributes";

const styles = StyleSheet.create({
  sideBarWithMenu: {
    width: 256,
    height: "100%",
    writingMode: "sideways-lr"
  },
  sideBarWithoutMenu: {
    writingMode: "vertical-rl",
    padding: "5px",
    paddingTop: "20px"
  }
});

export interface NavigationSection {
  name: string;
  path: string;
  role: string;
  badge?: { count: number };
}

interface Props {
  sections: NavigationSection[];
  onToggleMenu: () => React.MouseEventHandler<unknown>;
  switchListItem: JSX.Element;
  showMenu?: boolean;
}

const Navigation: React.FC<Props> = (props) => {
  const theme = useTheme();
  const history = useHistory();
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
                onClick={() => history.push(section.url)}
                rightAvatar={
                  section.badge && (
                    <Avatar
                      backgroundColor={theme.palette.badge.main}
                      size={30}
                    >
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

export default Navigation;
