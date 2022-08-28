import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import { useHistory } from "react-router-dom";

import type { NavigationSection } from "../components/Navigation";
import Navigation from "../components/Navigation";
import { dataTest } from "../lib/attributes";

interface AdminNavigationProps {
  organizationId: string;
  sections: NavigationSection[];
  showMenu?: boolean;
  onToggleMenu: () => React.MouseEventHandler<unknown>;
}

const AdminNavigation: React.FC<AdminNavigationProps> = (props) => {
  const history = useHistory();
  const { organizationId, sections, showMenu = true, onToggleMenu } = props;

  const urlFromPath = (path: string) => {
    return `/admin/${organizationId}/${path}`;
  };

  return (
    <Navigation
      onToggleMenu={onToggleMenu}
      showMenu={showMenu}
      sections={sections.map((section) => ({
        ...section,
        url: urlFromPath(section.path)
      }))}
      switchListItem={
        <ListItem
          button
          {...dataTest("navSwitchToTexter")}
          onClick={() => history.push(`/app/${organizationId}/todos`)}
        >
          <ListItemText primary="Switch to texter" />
        </ListItem>
      }
    />
  );
};

export default AdminNavigation;
