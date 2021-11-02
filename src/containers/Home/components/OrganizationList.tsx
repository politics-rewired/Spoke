import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import { History } from "history";
import sortBy from "lodash/sortBy";
import { List, ListItem } from "material-ui/List";
import Paper from "material-ui/Paper";
import { amber500, grey500 } from "material-ui/styles/colors";
import MailboxIcon from "material-ui/svg-icons/action/markunread-mailbox";
import NotificationsPausedIcon from "material-ui/svg-icons/social/notifications-paused";
import React from "react";
import { compose } from "react-apollo";
import { Redirect, withRouter } from "react-router-dom";

import { RelayPaginatedResponse } from "../../../api/pagination";
import theme from "../../../styles/theme";
import { loadData } from "../../hoc/with-operations";

const styles = StyleSheet.create({
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  }
});

interface MembershipType {
  id: string;
  role: string;
  organization: {
    id: string;
    name: string;
    myCurrentAssignmentTargets: {
      maxRequestCount: number;
    }[];
  };
}

export interface OrganizationListProps {
  data: {
    currentUser: {
      id: string;
      memberships: RelayPaginatedResponse<MembershipType>;
    };
    refetch(): void;
  };
  history: History;
}

export const OrganizationList: React.SFC<OrganizationListProps> = (props) => {
  const { currentUser } = props.data;

  const handleSelectOrg = (membership: MembershipType) => () => {
    const {
      role,
      organization: { id: orgId }
    } = membership;
    if (role === "TEXTER") {
      return props.history.push(`/app/${orgId}`);
    }
    return props.history.push(`/admin/${orgId}`);
  };

  const { edges: memberships } = currentUser.memberships;
  if (memberships.length === 0) {
    return (
      <div>
        <div className={css(styles.header)}>
          You currently aren't part of any organization!
        </div>
        <div>
          If you got sent a link by somebody to start texting, ask that person
          to send you the link to join their organization. Then, come back here
          and start texting!
        </div>
      </div>
    );
  }
  if (memberships.length === 1) {
    const {
      role,
      organization: { id: orgId }
    } = memberships[0].node;
    const path = role === "TEXTER" ? "app" : "admin";
    return <Redirect to={`/${path}/${orgId}`} />;
  }

  const showIcons = window.ASSIGNMENT_SHOW_REQUESTS_AVAILABLE;

  const hydratedList = memberships.map(({ node: membership }) => ({
    membership,
    hasAssignments:
      membership.organization.myCurrentAssignmentTargets.length > 0
  }));
  const sortedList = sortBy(hydratedList, [
    ({ hasAssignments }) => !hasAssignments, // sort "true" first
    ({ membership }) => membership.organization.id
  ]);

  return (
    <div>
      <div className={css(styles.header)}>Select your organization</div>
      {showIcons && (
        <p>
          Organizations with available assignments are marked with an amber
          mailbox icon.
        </p>
      )}
      <Paper style={{ margin: "15px auto", maxWidth: "450px" }}>
        <List>
          {sortedList.map(({ membership, hasAssignments }) => {
            const leftIcon = showIcons ? (
              hasAssignments ? (
                <MailboxIcon color={amber500} />
              ) : (
                <NotificationsPausedIcon color={grey500} />
              )
            ) : undefined;
            return (
              <ListItem
                leftIcon={leftIcon}
                key={membership.organization.id}
                primaryText={membership.organization.name}
                onClick={handleSelectOrg(membership)}
              />
            );
          })}
        </List>
      </Paper>
    </div>
  );
};

const queries = {
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          memberships {
            edges {
              node {
                id
                role
                organization {
                  id
                  name
                  myCurrentAssignmentTargets {
                    maxRequestCount
                  }
                }
              }
            }
          }
        }
      }
    `
  }
};

export default compose(loadData({ queries }), withRouter)(OrganizationList);
