import React from "react";
import { History } from "history";
import { withRouter } from "react-router";
import { ApolloQueryResult } from "apollo-client";
import { compose } from "react-apollo";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";

import { loadData } from "../hoc/with-operations";
import theme from "../../styles/theme";
import SuperAdminLogin from "../../components/SuperAdminLogin";
import OrganizationList from "./components/OrganizationList";

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

interface HomeProps {
  data: {
    currentUser: null | {
      id: string;
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

const Home: React.SFC<HomeProps> = (props) => {
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

  const handleOnSuperadminLogin = () => props.data.refetch();

  const { currentUser } = props.data;

  return (
    <div className={css(styles.container)}>
      <SuperAdminLogin onLoginComplete={handleOnSuperadminLogin} />
      <div className={css(styles.logoDiv)}>
        <img
          src="https://politics-rewired.surge.sh/spoke_logo.svg"
          className={css(styles.logoImg)}
        />
      </div>
      <div className={css(styles.content)}>
        {currentUser ? (
          <OrganizationList />
        ) : (
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
        )}
      </div>
    </div>
  );
};

const queries = {
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
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

export default compose(loadData({ queries, mutations }), withRouter)(Home);
