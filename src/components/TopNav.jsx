import PropTypes from "prop-types";
import React from "react";
import IconButton from "material-ui/IconButton";
import ArrowBackIcon from "material-ui/svg-icons/navigation/arrow-back";
import { Link } from "react-router-dom";
import UserMenu from "../containers/UserMenu";
import theme from "../styles/theme";
import { compose } from "react-apollo";
import { StyleSheet, css } from "aphrodite";
import { withOperations } from "../containers/hoc/with-operations";
import gql from "graphql-tag";

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

class TopNav extends React.Component {
  render() {
    const { backToURL, orgId, title } = this.props;
    console.log(this.props);
    // console.log(pros.data.organization);
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
            {this.props.data && this.props.data.organization
              ? `${this.props.data.organization.name} - `
              : ""}
            {title}
          </div>
        </div>
        <div className={css(styles.userMenu)}>
          <UserMenu orgId={orgId} />
        </div>
      </div>
    );
  }
}

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
          name
        }
      }
    `,
    options: ownProps => ({
      variables: {
        id: ownProps.orgId
      }
    })
  }
};

const C = withOperations({ queries })(TopNav);
export default C;
