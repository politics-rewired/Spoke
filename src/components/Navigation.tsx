import IconButton from "@material-ui/core/IconButton";
import { useTheme } from "@material-ui/core/styles";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import { css, StyleSheet } from "aphrodite";
import camelCase from "lodash/camelCase";
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
    height: "100%"
  }
});

export interface NavigationSection {
  name: string;
  path: string;
  role: string;
  badge?: { count: number };
  url: string;
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
            <IconButton onClick={props.onToggleMenu}>
              <ArrowBackIosIcon />
            </IconButton>
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
    <IconButton onClick={props.onToggleMenu}>
      <ArrowForwardIosIcon />
    </IconButton>
  );
};

export default Navigation;
