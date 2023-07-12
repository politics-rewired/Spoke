import { makeStyles } from "@material-ui/core";
import React, { useState } from "react";
import type { RouterProps } from "react-router-dom";
import { withRouter } from "react-router-dom";

import Navigation from "../components/Navigation";
import TopNav from "../components/TopNav";
import theme from "../styles/theme";
import { useAuthzContext } from "./AuthzProvider";

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
  const { isSuperadmin } = useAuthzContext();

  const classes = useStyles();
  const [showMenu, setShowMenu] = useState<boolean>(true);

  const onToggleMenu = () => setShowMenu(!showMenu);

  const sections = [
    { name: "People", path: "people", url: "/superadmin/people" },
    {
      name: "SuperAdmins",
      path: "superadmins",
      url: "/superadmin/superadmins"
    },
    {
      name: "Organizations",
      path: "organizations",
      url: "/superadmin/organizations"
    }
  ];

  const currentSection = sections
    .filter((section) => location.pathname.match(`/${section.path}`))
    .at(0);

  return isSuperadmin ? (
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
  ) : (
    <div>
      <TopNav
        sectionTitle="SuperAdmin"
        title={currentSection?.name ?? "SuperAdmin"}
      />
      <h1>You don't have permission to access this page</h1>
    </div>
  );
};

export default withRouter(SuperAdminDashboard);
