import React from "react";
import { History } from "history";
import { withRouter, Redirect } from "react-router";
import { ApolloQueryResult } from "apollo-client";
import { compose } from "react-apollo";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";

import Paper from "material-ui/Paper";
import { List, ListItem } from "material-ui/List";

import { loadData } from "./hoc/with-operations";
import { RelayPaginatedResponse } from "../api/types";
import theme from "../styles/theme";
import SuperAdminLogin from "../components/SuperAdminLogin";

const styles = StyleSheet.create({
  container: {
    marginTop: "5vh",
    textAlign: "center",
    color: theme.colors.lightGray
  },
  content: {
    ...theme.layouts.greenBox,
    paddingLeft: "10px",
    paddingRight: "10px"
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  logoDiv: {
    ...theme.components.logoDiv
  },
  logoImg: {
    width: 120,
    ...theme.components.logoImg
  },
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  },
  link_dark_bg: {
    ...theme.text.link_dark_bg
  }
});

interface InviteInput {
  id?: string;
  is_valid?: boolean;
  hash?: string;
  created_at?: string;
}

interface MembershipType {
  id: string;
  role: string;
  organization: {
    id: string;
    name: string;
  };
}

interface HomeProps {
  data: {
    currentUser: null | {
      id: string;
      memberships: RelayPaginatedResponse<MembershipType>;
    };
    refetch(): void;
  };
  mutations: {
    createInvite(
      invite: InviteInput
    ): ApolloQueryResult<{ createInvite: { hash: string } }>;
  };
  history: History;
}

const Home: React.SFC<HomeProps> = props => {
  // not sure if we need this anymore -- only for new organizations
  const handleOrgInviteClick = async (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (window.SUPPRESS_SELF_INVITE !== true) {
      e.preventDefault();
      const newInvite = await props.mutations.createInvite({
        is_valid: true
      });
      if (newInvite.errors) {
        alert("There was an error creating your invite");
        throw newInvite.errors;
      } else {
        props.history.push(
          `/login?nextUrl=/invite/${newInvite.data.createInvite.hash}`
        );
      }
    }
  };

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

  const handleOnSuperadminLogin = () => props.data.refetch();

  const renderContent = () => {
    const { currentUser } = props.data;

    if (currentUser === null) {
      return (
        <div>
          <div className={css(styles.header)}>
            Spoke is a new way to run campaigns using text messaging.
          </div>
          <div>
            <a
              id="login"
              className={css(styles.link_dark_bg)}
              href={window.ALTERNATE_LOGIN_URL || "/login"}
              onClick={handleOrgInviteClick}
            >
              Login and get started
            </a>
          </div>
        </div>
      );
    }

    const { edges: memberships } = currentUser.memberships;
    if (memberships.length === 0) {
      return (
        <div>
          <div className={css(styles.header)}>
            You currently aren't part of any organization!
          </div>
          <div>
            If you got sent a link by somebody to start texting, ask that person
            to send you the link to join their organization. Then, come back
            here and start texting!
          </div>
        </div>
      );
    } else if (memberships.length === 1) {
      const {
        role,
        organization: { id: orgId }
      } = memberships[0].node;
      const path = role === "TEXTER" ? "app" : "admin";
      return <Redirect to={`/${path}/${orgId}`} />;
    }

    return (
      <div>
        <div className={css(styles.header)}>Select your organization</div>
        <Paper style={{ margin: "15px auto", maxWidth: "450px" }}>
          <List>
            {memberships.map(({ node: membership }) => (
              <ListItem
                key={membership.organization.id}
                primaryText={membership.organization.name}
                onClick={handleSelectOrg(membership)}
              />
            ))}
          </List>
        </Paper>
      </div>
    );
  };

  return (
    <div className={css(styles.container)}>
      <SuperAdminLogin onLoginComplete={handleOnSuperadminLogin} />
      <div className={css(styles.logoDiv)}>
        <img
          src="https://politics-rewired.surge.sh/spoke_logo.svg"
          className={css(styles.logoImg)}
        />
      </div>
      <div className={css(styles.content)}>{renderContent()}</div>
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
                }
              }
            }
          }
        }
      }
    `
  }
};

const mutations = {
  createInvite: (ownProps: HomeProps) => (invite: InviteInput) => ({
    mutation: gql`
      mutation createInvite($invite: InviteInput!) {
        createInvite(invite: $invite) {
          hash
        }
      }
    `,
    variables: { invite }
  })
};

export default compose(
  loadData({ queries, mutations }),
  withRouter
)(Home);
