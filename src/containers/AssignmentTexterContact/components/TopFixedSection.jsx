import { Tooltip } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import HomeIcon from "@material-ui/icons/Home";
import React from "react";

import ContactToolbar from "../../../components/ContactToolbar";

const TopFixedSection = (props) => {
  const { contactSettings, contact, campaign, onExitTexter } = props;

  return (
    <ContactToolbar
      campaign={campaign}
      campaignContact={contact}
      contactSettings={contactSettings}
      rightToolbarIcon={
        <Tooltip title="Return Home" placement="bottom">
          <IconButton onClick={onExitTexter}>
            <HomeIcon />
          </IconButton>
        </Tooltip>
      }
    />
  );
};

export default TopFixedSection;
