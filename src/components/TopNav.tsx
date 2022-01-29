import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import IconButton from "material-ui/IconButton";
import muiThemeable from "material-ui/styles/muiThemeable";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { compose } from "recompose";

import { Organization } from "../api/organization";
import { withOperations } from "../containers/hoc/with-operations";
import UserMenu from "../containers/UserMenu";
import { QueryMap } from "../network/types";
import baseTheme from "../styles/theme";
import { MuiThemeProviderProps } from "../styles/types";

const styles = StyleSheet.create({
  container: {
    ...baseTheme.layouts.multiColumn.container,
    color: baseTheme.colors.white,
    height: 65,
    verticalAlign: "middle",
    paddingLeft: 15,
    paddingRight: 15
  },
  inline: {
    display: "inline-block",
    marginLeft: 5,
    marginTop: "auto",
    marginBottom: "auto"
  },
  userMenu: {
    marginTop: "auto",
    marginBottom: "auto"
  },
  header: {
    ...baseTheme.text.header,
    fontSize: 24,
    color: baseTheme.colors.white
  },
  flexColumn: {
    flex: 1,
    textAlign: "left",
    display: "flex"
  }
});

interface OuterProps {
  backToURL?: string;
  title: string;
  orgId: string;
}

interface InnerProps extends OuterProps, MuiThemeProviderProps {
  data: { organization?: Pick<Organization, "id" | "name"> };
}

const TopNav: React.FC<InnerProps> = (props) => {
  const { backToURL, orgId, title, muiTheme } = props;

  const overrides = {
    container: {
      backgroundColor:
        muiTheme?.palette?.primary1Color ?? baseTheme.colors.green
    }
  };

  const orgTitle = props.data?.organization
    ? `${props.data.organization.name} - ${title}`
    : "";

  return (
    <div className={css(styles.container)} style={overrides.container}>
      <Helmet>
        <title>{orgTitle}</title>
      </Helmet>
      <div className={css(styles.flexColumn)}>
        <div className={css(styles.inline)}>
          {backToURL && (
            <Link to={backToURL}>
              <IconButton>
                <ArrowBackIcon
                  style={{ fill: "white" }}
                  color={baseTheme.colors.white}
                />
              </IconButton>
            </Link>
          )}
        </div>
        <div className={css(styles.inline, styles.header)}>{orgTitle}</div>
      </div>
      <div className={css(styles.userMenu)}>
        <UserMenu orgId={orgId} />
      </div>
    </div>
  );
};

const queries: QueryMap<OuterProps> = {
  data: {
    query: gql`
      query getOrganizationName($id: String!) {
        organization(id: $id) {
          id
          name
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        id: ownProps.orgId
      }
    })
  }
};

export default compose<InnerProps, OuterProps>(
  muiThemeable(),
  withOperations({ queries })
)(TopNav);
