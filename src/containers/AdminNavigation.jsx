import { ListItem } from "material-ui/List";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "../components/ClassRouter";

import Navigation from "../components/Navigation";
import { dataTest } from "../lib/attributes";

class AdminNavigation extends React.Component {
  urlFromPath(path) {
    const { organizationId } = this.props;
    return `/admin/${organizationId}/${path}`;
  }

  render() {
    const { organizationId, sections } = this.props;
    return (
      <Navigation
        onToggleMenu={this.props.onToggleMenu}
        showMenu={this.props.showMenu}
        sections={sections.map((section) => ({
          ...section,
          url: this.urlFromPath(section.path)
        }))}
        switchListItem={
          <ListItem
            {...dataTest("navSwitchToTexter")}
            primaryText="Switch to texter"
            onClick={() =>
              this.props.history.push(`/app/${organizationId}/todos`)
            }
          />
        }
      />
    );
  }
}

AdminNavigation.defaultProps = {
  showMenu: true
};

AdminNavigation.propTypes = {
  data: PropTypes.object,
  organizationId: PropTypes.string,
  history: PropTypes.object.isRequired,
  sections: PropTypes.array,
  match: PropTypes.object.isRequired,
  onToggleMenu: PropTypes.func.isRequired,
  showMenu: PropTypes.bool
};

export default withRouter(AdminNavigation);
