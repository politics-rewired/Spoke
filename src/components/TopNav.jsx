import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import IconButton from "material-ui/IconButton";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";

import { withOperations } from "../containers/hoc/with-operations";
import UserMenu from "../containers/UserMenu";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    backgroundColor: theme.colors.green,
    color: theme.colors.white,
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
    ...theme.text.header,
    fontSize: 24,
    color: theme.colors.white
  },
  flexColumn: {
    flex: 1,
    textAlign: "left",
    display: "flex"
  }
});

const TopNav = (props) => {
  const { backToURL, orgId, title } = props;
  return (
    <div className={css(styles.container)}>
      <div className={css(styles.flexColumn)}>
        <div className={css(styles.inline)}>
          {backToURL && (
            <Link to={backToURL}>
              <IconButton>
                <ArrowBackIcon
                  style={{ fill: "white" }}
                  color={theme.colors.white}
                />
              </IconButton>
            </Link>
          )}
        </div>
        <div className={css(styles.inline, styles.header)}>
          {props.data && props.data.organization
            ? `${props.data.organization.name} - `
            : ""}
          {title}
        </div>
      </div>
      <div className={css(styles.userMenu)}>
        <UserMenu orgId={orgId} />
      </div>
    </div>
  );
};

TopNav.propTypes = {
  backToURL: PropTypes.string,
  title: PropTypes.string.isRequired,
  orgId: PropTypes.string
};

const queries = {
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

export default withOperations({ queries })(TopNav);
