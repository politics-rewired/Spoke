import { makeStyles } from "@material-ui/core";
import React, { useState } from "react";
import { RouterProps, withRouter } from "react-router-dom";

import theme from "../styles/theme";
import Navigation from "./Navigation";
import TopNav from "./TopNav";

const useStyles = makeStyles({
  container: {
    ...theme.layouts.multiColumn.container
  },
  sidebar: {
    minHeight: "calc(100vh - 56px)"
  },
  content: {
    ...theme.layouts.multiColumn.flexColumn,
    paddingLeft: "2rem",
    paddingRight: "2rem",
    margin: "24px auto"
  }
});

interface SuperAdminDashboardProps extends RouterProps {
  children: JSX.Element;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  location,
  children
}) => {
  const classes = useStyles();
  const [showMenu, setShowMenu] = useState<boolean>(true);

  const onToggleMenu = () => setShowMenu(!showMenu);

  const sections = [{ name: "People", path: "people" }];

  const currentSection = sections
    .filter((section) => location.pathname.match(`/${section.path}`))
    .at(0);
  return (
    <div>
      <TopNav
        sectionTitle="SuperAdmin"
        title={currentSection?.name ?? "SuperAdmin"}
      />
      <div className={classes.container}>
        <div className={classes.sidebar}>
          <Navigation
            onToggleMenu={onToggleMenu}
            sections={sections}
            showMenu={showMenu}
          />
        </div>
        <div className={classes.content}>{children}</div>
      </div>
    </div>
  );
};

export default withRouter(SuperAdminDashboard);
