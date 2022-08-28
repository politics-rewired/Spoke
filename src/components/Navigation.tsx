import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import camelCase from "lodash/camelCase";
import React from "react";
import { useHistory } from "react-router-dom";

import { dataTest } from "../lib/attributes";

const useStyles = makeStyles((theme) => ({
  sideBarWithMenu: {
    width: 256,
    height: "100%",
    backgroundColor: theme.palette.background.paper
  },
  badge: {
    backgroundColor: theme.palette.badge?.main,
    width: theme.spacing(3),
    height: theme.spacing(3)
  }
}));

export interface NavigationSection {
  name: string;
  path: string;
  role?: string;
  badge?: { count: number };
  url?: string;
}

interface Props {
  sections: NavigationSection[];
  onToggleMenu: () => React.MouseEventHandler<unknown>;
  switchListItem?: JSX.Element;
  showMenu?: boolean;
}

const Navigation: React.FC<Props> = (props) => {
  const history = useHistory();
  const classes = useStyles();
  const { sections, switchListItem } = props;

  if (props.showMenu) {
    return (
      <div className={classes.sideBarWithMenu}>
        <Paper
          elevation={2}
          square
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
                button
                {...dataTest(camelCase(`nav ${section.path}`))}
                key={section.name}
                onClick={() => section.url && history.push(section.url)}
              >
                <ListItemText primary={section.name} />
                {section.badge && (
                  <ListItemSecondaryAction>
                    <Avatar className={classes.badge}>
                      {section.badge?.count}
                    </Avatar>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
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
