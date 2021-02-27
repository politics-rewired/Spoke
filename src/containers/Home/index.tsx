import { css, StyleSheet } from "aphrodite/no-important";
import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import { History } from "history";
import muiThemeable from "material-ui/styles/muiThemeable";
import React, { useContext } from "react";
import { compose } from "react-apollo";
import { withRouter } from "react-router-dom";

import SpokeContext from "../../client/spoke-context";
import SuperAdminLogin from "../../components/SuperAdminLogin";
import { MutationMap, QueryMap } from "../../network/types";
import theme from "../../styles/theme";
import { MuiThemeProviderProps } from "../../styles/types";
import { loadData } from "../hoc/with-operations";
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

interface HomeProps extends MuiThemeProviderProps {
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

const Home: React.FC<HomeProps> = (props) => {
  const themeOverrides = {
    content: {
      backgroundColor:
        props.muiTheme?.palette?.primary1Color ?? theme.colors.green
    }
  };

  const context = useContext(SpokeContext);
  const logoUrl =
    context.theme?.logoUrl ??
    "https://politics-rewired.surge.sh/spoke_logo.svg";

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
        // eslint-disable-next-line no-alert
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
        <img src={logoUrl} className={css(styles.logoImg)} />
      </div>
      <div
        className={css(styles.content)}
        style={{ ...themeOverrides.content }}
      >
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

const queries: QueryMap<HomeProps> = {
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

const mutations: MutationMap<HomeProps> = {
  createInvite: (_ownProps) => (invite: InviteInput) => ({
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
  muiThemeable(),
  loadData({ queries, mutations }),
  withRouter
)(Home);
