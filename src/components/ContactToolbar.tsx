import { grey } from "@material-ui/core/colors";
import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import React from "react";

import type { Campaign } from "../api/campaign";
import type { CampaignContact } from "../api/campaign-contact";
import type { OrganizationSettings } from "../api/organization-settings";
import { DateTime } from "../lib/datetime";

const inlineStyles = {
  toolbar: {
    backgroundColor: grey[100]
  },
  locationToolbarTitle: {
    fontSize: "1em"
  },
  timeToolbarTitle: {
    fontSize: "1em"
  }
};

interface ContactToolbarProps {
  campaignContact: CampaignContact;
  contactSettings: Pick<
    OrganizationSettings,
    "showContactLastName" | "showContactCell"
  >;
  rightToolbarIcon: React.ReactNode;
  campaign: Campaign;
}

const ContactToolbar: React.FC<ContactToolbarProps> = (props) => {
  const {
    campaign,
    campaignContact,
    contactSettings,
    rightToolbarIcon
  } = props;
  const {
    location: contactLocation,
    timezone: contactTimezone,
    firstName,
    lastName
  } = campaignContact;

  const contactName = contactSettings.showContactLastName
    ? `${firstName} ${lastName}`
    : `${firstName}`;

  const timezone = contactTimezone || campaign.timezone;
  const localTime = DateTime.local()
    .setZone(timezone)
    .toLocaleString(DateTime.TIME_SIMPLE);

  const location = [contactLocation?.city, contactLocation?.state]
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

export default ContactToolbar;
