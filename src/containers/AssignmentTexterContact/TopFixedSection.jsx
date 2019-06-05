import React from "react";
import ContactToolbar from "../../components/ContactToolbar";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";
import IconButton from "material-ui/IconButton/IconButton";

const buttonStyle = {
  float: "right",
  height: "50px",
  zIndex: 100,
  position: "absolute",
  top: 0,
  right: "-30"
};

const TopFixedSection = props => {
  const { contact, campaign, onExitTexter } = props;

  return (
    <ContactToolbar
      campaign={campaign}
      campaignContact={contact}
      rightToolbarIcon={
        <IconButton
          onTouchTap={onExitTexter}
          style={buttonStyle}
          tooltip="Return Home"
          tooltipPosition="bottom-center"
        >
          <NavigateHomeIcon />
        </IconButton>
      }
    />
  );
};

export default TopFixedSection;
