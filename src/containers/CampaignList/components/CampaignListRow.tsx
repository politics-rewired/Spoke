import Avatar from "@material-ui/core/Avatar";
import Chip from "@material-ui/core/Chip";
import blue from "@material-ui/core/colors/blue";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import { useTheme } from "@material-ui/core/styles";
import WarningIcon from "@material-ui/icons/Warning";
import type { CampaignListEntryFragment } from "@spoke/spoke-codegen";
import React from "react";
import { useHistory } from "react-router-dom";

import { dataTest } from "../../../lib/attributes";
import { DateTime } from "../../../lib/datetime";
import type { CampaignOperations } from "./CampaignListMenu";
import CampaignListMenu from "./CampaignListMenu";

const inlineStyles = {
  chipWrapper: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center"
  },
  chip: { margin: "4px" },
  past: {
    opacity: 0.6
  },
  secondaryText: {
    whiteSpace: "pre-wrap"
  }
};

interface Props extends CampaignOperations {
  organizationId: string;
  isAdmin: boolean;
  campaign: CampaignListEntryFragment;
}

export const CampaignListRow: React.FC<Props> = (props) => {
  const theme = useTheme();
  const history = useHistory();
  const { organizationId, isAdmin, campaign } = props;
  const {
    isStarted,
    isArchived,
    isAutoassignEnabled,
    hasUnassignedContacts,
    hasUnsentInitialMessages,
    hasUnhandledMessages,
    teams,
    campaignGroups,
    externalSystem
  } = campaign;

  let listItemStyle = {};
  let leftIcon;
  if (isArchived) {
    listItemStyle = inlineStyles.past;
  } else if (!isStarted || hasUnassignedContacts) {
    listItemStyle = {
      color: theme.palette.warning.dark
    };
    leftIcon = <WarningIcon />;
  } else if (hasUnsentInitialMessages) {
    listItemStyle = {
      color: theme.palette.info.dark
    };
  } else {
    listItemStyle = {
      color: theme.palette.success.dark
    };
  }
  const dueBy = DateTime.fromISO(campaign.dueBy || "");
  const creatorName = campaign.creator ? campaign.creator.displayName : null;
  let tags = [];
  if (DateTime.local() >= dueBy) {
    tags.push({
      title: "Overdue",
      color: theme.palette.grey[900],
      backgroundColor: theme.palette.error.main
    });
  }

  if (externalSystem) {
    const title = `${externalSystem.type}: ${externalSystem.name}`;
    tags.push({ title, backgroundColor: blue[300] });
  }

  if (!isStarted) {
    tags.push({ title: "Not started" });
  }

  if (hasUnassignedContacts) {
    tags.push({ title: "Unassigned contacts" });
  }

  if (isStarted && hasUnsentInitialMessages) {
    tags.push({ title: "Unsent initial messages" });
  }

  if (isStarted && hasUnhandledMessages) {
    tags.push({ title: "Unhandled replies" });
  }

  if (isStarted && !isArchived && isAutoassignEnabled) {
    tags.push({ title: "Autoassign eligible" });
  }

  tags = tags.concat(teams.map(({ title }) => ({ title })));
  if (campaignGroups) {
    tags = tags.concat(
      campaignGroups.edges.map(({ node }) => ({ title: node.name }))
    );
  }

  const primaryText = (
    <div style={inlineStyles.chipWrapper}>
      {campaign.title}
      {tags.map((tag) => (
        <Chip
          key={tag.title}
          label={tag.title}
          style={{
            ...inlineStyles.chip,
            color: tag.color,
            backgroundColor: tag.backgroundColor
          }}
        />
      ))}
    </div>
  );
  const secondaryText = (
    <span style={inlineStyles.secondaryText}>
      <span>
        Campaign ID: {campaign.id}
        <br />
        {campaign.description}
        {creatorName ? <span> &mdash; Created by {creatorName}</span> : null}
        <br />
        {dueBy.isValid ? dueBy.toFormat("DD") : "No due date set"}
      </span>
    </span>
  );

  const campaignUrl = `/admin/${organizationId}/campaigns/${campaign.id}${
    isStarted ? "" : "/edit"
  }`;
  return (
    <ListItem
      {...dataTest("campaignRow")}
      style={listItemStyle}
      onClick={() => history.push(campaignUrl)}
    >
      {leftIcon && (
        <ListItemAvatar>
          <Avatar>{leftIcon}</Avatar>
        </ListItemAvatar>
      )}
      <ListItemText
        primary={primaryText}
        secondary={secondaryText}
        secondaryTypographyProps={{ color: "textPrimary" }}
      />
      {isAdmin && (
        <ListItemSecondaryAction>
          <CampaignListMenu
            campaign={campaign}
            startOperation={props.startOperation}
            archiveCampaign={props.archiveCampaign}
            unarchiveCampaign={props.unarchiveCampaign}
          />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

export default CampaignListRow;
