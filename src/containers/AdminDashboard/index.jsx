import { gql } from "@apollo/client";
import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import TopNav from "../../components/TopNav";
import { hasRole } from "../../lib/permissions";
import theme from "../../styles/theme";
import AdminNavigation from "../AdminNavigation";
import { loadData } from "../hoc/with-operations";
import NotificationCard from "./components/NotificationCard";

const styles = StyleSheet.create({
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

class AdminDashboard extends React.Component {
  state = {
    showMenu: true
  };

  urlFromPath = (path) => {
    const { organizationId } = this.props.match.params;
    return `/admin/${organizationId}/${path}`;
  };

  handleToggleMenu = () => this.setState({ showMenu: !this.state.showMenu });

  renderNavigation(sections) {
    const { organizationId } = this.props.match.params;

    if (!organizationId) {
      return "";
    }

    return (
      <div className={css(styles.sidebar)}>
        <AdminNavigation
          onToggleMenu={this.handleToggleMenu}
          showMenu={this.state.showMenu}
          organizationId={organizationId}
          sections={sections}
        />
      </div>
    );
  }

  render() {
    const { location, children, match, organizationData } = this.props;
    const { roles } = this.props.data.currentUser;
    const { escalatedConversationCount, pendingAssignmentRequestCount } =
      (this.props.badgeCounts || {}).organization || {};
    const { totalCount: trollCount } =
      (this.props.trollAlarmsCount || {}).trollAlarmsCount || {};

    const sections = [
      { name: "Campaigns", path: "campaigns", role: "ADMIN" },
      { name: "Template Campaigns", path: "template-campaigns", role: "ADMIN" },
      { name: "Campaign Groups", path: "campaign-groups", role: "ADMIN" },
      { name: "People", path: "people", role: "ADMIN" },
      { name: "Teams", path: "teams", role: "ADMIN" },
      { name: "Assignment Control", path: "assignment-control", role: "ADMIN" },
      { name: "Autosending", path: "autosending", role: "ADMIN" },
      { name: "Tags", path: "tag-editor", role: "ADMIN" },
      { name: "Opt Outs", path: "optouts", role: "ADMIN" },
      { name: "Message Review", path: "incoming", role: "SUPERVOLUNTEER" },
      {
        name: "Escalated Convos",
        path: "escalated",
        role: "ADMIN",
        badge: window.DISABLE_SIDEBAR_BADGES
          ? undefined
          : { count: escalatedConversationCount }
      },
      { name: "Bulk Script Editor", path: "bulk-script-editor", role: "OWNER" },
      { name: "Short Link Domains", path: "short-link-domains", role: "OWNER" },
      {
        name: "Assignment Requests",
        path: "assignment-requests",
        role: "SUPERVOLUNTEER",
        badge: window.DISABLE_SIDEBAR_BADGES
          ? undefined
          : { count: pendingAssignmentRequestCount }
      },
      {
        name: "Troll Alarms",
        path: "trollalarms",
        role: "SUPERVOLUNTEER",
        badge: window.DISABLE_SIDEBAR_BADGES ? undefined : { count: trollCount }
      },
      { name: "Integrations", path: "integrations", role: "OWNER" },
      { name: "Settings", path: "settings", role: "OWNER" }
    ];

    if (!window.ENABLE_AUTOSENDING) {
      const index = sections.findIndex((s) => s.name === "Autosending");
      sections.splice(index, 1);
    }

    if (window.DISABLE_ASSIGNMENT_PAGE) {
      const index = sections.findIndex((s) => s.name === "Assignment Requests");
      sections.splice(index, 1);
    }

    if (!window.ENABLE_TROLLBOT) {
      const index = sections.findIndex((s) => s.name === "Troll Alarms");
      sections.splice(index, 1);
    }

    if (!window.ENABLE_SHORTLINK_DOMAINS) {
      const index = sections.findIndex((s) => s.name === "Short Link Domains");
      sections.splice(index, 1);
    }

    if (!window.ENABLE_CAMPAIGN_GROUPS) {
      const index = sections.findIndex((s) => s.name === "Campaign Groups");
      sections.splice(index, 1);
    }

    let currentSection = sections.filter((section) =>
      location.pathname.match(`/${section.path}`)
    );

    currentSection = currentSection.length > 0 ? currentSection.shift() : null;
    const title = currentSection ? currentSection.name : "Admin";
    const backToURL =
      currentSection &&
      location.pathname.split("/").pop() !== currentSection.path
        ? this.urlFromPath(currentSection.path)
        : null;

    return (
      <div>
        <TopNav
          title={title}
          backToURL={backToURL}
          orgId={match.params.organizationId}
          sectionTitle={organizationData.organization.name}
        />
        <div className={css(styles.container)}>
          {this.renderNavigation(
            sections.filter((s) => hasRole(s.role, roles))
          )}
          <div className={css(styles.content)}>
            <NotificationCard organizationId={match.params.organizationId} />
            {children}
          </div>
        </div>
      </div>
    );
  }
}

AdminDashboard.propTypes = {
  match: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  badgeCounts: PropTypes.object.isRequired,
  trollAlarmsCount: PropTypes.object.isRequired
};

const queries = {
  data: {
    query: gql`
      query getCurrentUserRoles($organizationId: String!) {
        currentUser {
          id
          roles(organizationId: $organizationId)
        }
      }
    `,
    options: ({ match }) => ({
      variables: {
        organizationId: match.params.organizationId
      }
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationName($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
        }
      }
    `,
    options: ({ match }) => ({
      variables: {
        organizationId: match.params.organizationId
      }
    })
  },
  badgeCounts: {
    query: gql`
      query getBadgeCounts($organizationId: String!) {
        organization(id: $organizationId) {
          id
          escalatedConversationCount
          pendingAssignmentRequestCount
        }
      }
    `,
    skip: window.DISABLE_SIDEBAR_BADGES,
    options: ({ match }) => ({
      variables: {
        organizationId: match.params.organizationId
      }
    })
  },
  trollAlarmsCount: {
    query: gql`
      query getTrollAlarmsCount(
        $organizationId: String!
        $dismissed: Boolean!
      ) {
        trollAlarmsCount(
          organizationId: $organizationId
          dismissed: $dismissed
        ) {
          totalCount
        }
      }
    `,
    skip: window.DISABLE_SIDEBAR_BADGES || !window.ENABLE_TROLLBOT,
    options: ({ match }) => ({
      variables: {
        organizationId: match.params.organizationId,
        dismissed: false
      }
    })
  }
};

export default compose(withRouter, loadData({ queries }))(AdminDashboard);
