import PropTypes from "prop-types";
import React from "react";
import moment from "moment-timezone";

import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import { grey100 } from "material-ui/styles/colors";

const inlineStyles = {
  toolbar: {
    backgroundColor: grey100
  },
  cellToolbarTitle: {
    fontSize: "1em"
  },
  locationToolbarTitle: {
    fontSize: "1em"
  },
  timeToolbarTitle: {
    fontSize: "1em"
  }
};

const ContactToolbar = function ContactToolbar(props) {
  const { campaign, campaignContact, rightToolbarIcon } = props;
  const {
    location: { city, state },
    timezone: contactTimezone
  } = campaignContact;

  const timezone = contactTimezone || campaign.timezone;
  const localTime = moment()
    .tz(timezone)
    .format("LT"); // format('h:mm a')

  const location = [city, state]
    .filter(item => !!item)
    .join(", ")
    .trim();

  return (
    <div>
      <Toolbar style={inlineStyles.toolbar}>
        <ToolbarGroup>
          <ToolbarTitle text={campaignContact.firstName} />
          <ToolbarTitle style={inlineStyles.cellToolbarTitle} />
          <ToolbarTitle
            text={localTime}
            style={inlineStyles.timeToolbarTitle}
          />
          {location !== "" && (
            <ToolbarTitle
              style={inlineStyles.locationToolbarTitle}
              text={location}
            />
          )}
          {rightToolbarIcon}
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
};

ContactToolbar.propTypes = {
  campaignContact: PropTypes.object, // contacts for current assignment
  rightToolbarIcon: PropTypes.element,
  campaign: PropTypes.object
};

export default ContactToolbar;
