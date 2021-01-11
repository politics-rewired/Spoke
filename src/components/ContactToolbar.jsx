import { DateTime } from "luxon";
import { grey100 } from "material-ui/styles/colors";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import PropTypes from "prop-types";
import React from "react";

import { parseIanaZone } from "../lib/timezones";

const inlineStyles = {
  toolbar: {
    backgroundColor: grey100
  },
  locationToolbarTitle: {
    fontSize: "1em"
  },
  timeToolbarTitle: {
    fontSize: "1em"
  }
};

const ContactToolbar = function ContactToolbar(props) {
  const {
    campaign,
    campaignContact,
    contactSettings,
    rightToolbarIcon
  } = props;
  const {
    location: { city, state },
    timezone: contactTimezone,
    firstName,
    lastName
  } = campaignContact;

  const contactName = contactSettings.showContactLastName
    ? `${firstName} ${lastName}`
    : `${firstName}`;

  const timezone = contactTimezone || campaign.timezone;
  const localTime = DateTime.local()
    .setZone(parseIanaZone(timezone))
    .toLocaleString(DateTime.TIME_SIMPLE);

  const location = [city, state]
    .filter((item) => !!item)
    .join(", ")
    .trim();

  const cell = contactSettings.showContactCell
    ? campaignContact.cell
    : undefined;
  const detailComponents = [location, localTime, cell].filter((item) => !!item);

  const contactDetailText = (
    <span>
      {contactName} &nbsp;&nbsp; {detailComponents.join(" ")}
    </span>
  );

  return (
    <Toolbar style={inlineStyles.toolbar}>
      <ToolbarGroup>
        {rightToolbarIcon}
        <ToolbarTitle text={campaign.title} />
        <ToolbarTitle
          text={contactDetailText}
          style={inlineStyles.timeToolbarTitle}
        />
      </ToolbarGroup>
    </Toolbar>
  );
};

ContactToolbar.propTypes = {
  campaignContact: PropTypes.object, // contacts for current assignment
  rightToolbarIcon: PropTypes.element,
  campaign: PropTypes.object
};

export default ContactToolbar;
