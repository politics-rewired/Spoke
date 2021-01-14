import Chip from "material-ui/Chip";
import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import { List, ListItem } from "material-ui/List";
import MenuItem from "material-ui/MenuItem";
import { blue300, grey900, red300 } from "material-ui/styles/colors";
import SpeakerNotesIcon from "material-ui/svg-icons/action/speaker-notes";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ArchiveIcon from "material-ui/svg-icons/content/archive";
import UnarchiveIcon from "material-ui/svg-icons/content/unarchive";
import MoreVertIcon from "material-ui/svg-icons/navigation/more-vert";
import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router-dom";

import Empty from "../../components/Empty";
import { dataTest } from "../../lib/attributes";
import { DateTime } from "../../lib/datetime";
import theme from "../../styles/theme";

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
  warn: {
    color: theme.colors.orange
  },
  good: {
    color: theme.colors.green
  },
  warnUnsent: {
    color: theme.colors.blue
  },
  secondaryText: {
    whiteSpace: "pre-wrap"
  }
};

export class CampaignList extends React.Component {
  renderMenu(campaign) {
    const { startOperation, archiveCampaign, unarchiveCampaign } = this.props;
    return (
      <IconMenu
        iconButtonElement={
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        }
      >
        <MenuItem
          primaryText="Release Unsent Messages"
          onClick={startOperation("releaseUnsentMessages", campaign)}
        />
        <MenuItem
          primaryText="Mark for a Second Pass"
          onClick={startOperation("markForSecondPass", campaign, {
            excludeRecentlyTexted: true,
            days: 3,
            hours: 0
          })}
        />
        <MenuItem
          primaryText="Release Unreplied Conversations"
          onClick={startOperation("releaseUnrepliedMessages", campaign, {
            ageInHours: 1
          })}
        />
        {!campaign.isArchived && (
          <MenuItem
            primaryText="Archive Campaign"
            leftIcon={<ArchiveIcon />}
            onClick={() => archiveCampaign(campaign.id)}
          />
        )}
        {campaign.isArchived && (
          <MenuItem
            primaryText="Unarchive Campaign"
            leftIcon={<UnarchiveIcon />}
            onClick={() => unarchiveCampaign(campaign.id)}
          />
        )}
        <MenuItem
          primaryText="Delete Unmessaged Contacts"
          onClick={startOperation("deleteNeedsMessage", campaign)}
        />

        <MenuItem
          primaryText="Un-Mark for Second Pass"
          onClick={startOperation("unMarkForSecondPass", campaign)}
        />
        <MenuItem
          primaryText={
            campaign.isAutoassignEnabled
              ? "Turn auto-assign OFF"
              : "Turn auto-assign ON"
          }
          onClick={startOperation(
            campaign.isAutoassignEnabled
              ? "turnAutoAssignOff"
              : "turnAutoAssignOn",
            campaign
          )}
        />
      </IconMenu>
    );
  }

  renderRow(campaign) {
    const { organizationId, adminPerms, history } = this.props;
    const {
      isStarted,
      isArchived,
      isAutoassignEnabled,
      hasUnassignedContacts,
      hasUnsentInitialMessages,
      hasUnhandledMessages,
      teams,
      externalSystem
    } = campaign;

    let listItemStyle = {};
    let leftIcon;
    if (isArchived) {
      listItemStyle = inlineStyles.past;
    } else if (!isStarted || hasUnassignedContacts) {
      listItemStyle = inlineStyles.warn;
      leftIcon = <WarningIcon />;
    } else if (hasUnsentInitialMessages) {
      listItemStyle = inlineStyles.warnUnsent;
    } else {
      listItemStyle = inlineStyles.good;
    }
    const dueBy = DateTime.fromISO(campaign.dueBy);
    const creatorName = campaign.creator ? campaign.creator.displayName : null;
    let tags = [];
    if (DateTime.local() >= dueBy) {
      tags.push({ title: "Overdue", color: grey900, backgroundColor: red300 });
    }

    if (externalSystem) {
      const title = `${externalSystem.type}: ${externalSystem.name}`;
      tags.push({ title, backgroundColor: blue300 });
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

    const primaryText = (
      <div style={inlineStyles.chipWrapper}>
        {campaign.title}
        {tags.map((tag) => (
          <Chip
            key={tag.title}
            labelColor={tag.color}
            backgroundColor={tag.backgroundColor}
            style={inlineStyles.chip}
          >
            {tag.title}
          </Chip>
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
        key={campaign.id}
        primaryText={primaryText}
        onClick={() => history.push(campaignUrl)}
        secondaryText={secondaryText}
        leftIcon={leftIcon}
        rightIconButton={adminPerms && this.renderMenu(campaign)}
      />
    );
  }

  render() {
    const { campaigns } = this.props;

    if (campaigns.length === 0) {
      return <Empty title="No campaigns" icon={<SpeakerNotesIcon />} />;
    }

    return <List>{campaigns.map((campaign) => this.renderRow(campaign))}</List>;
  }
}

const campaignShape = PropTypes.shape({
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  dueBy: PropTypes.string
});

CampaignList.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaigns: PropTypes.arrayOf(campaignShape).isRequired,
  adminPerms: PropTypes.bool.isRequired,
  history: PropTypes.object.isRequired,
  startOperation: PropTypes.func.isRequired,
  archiveCampaign: PropTypes.func.isRequired,
  unarchiveCampaign: PropTypes.func.isRequired
};

export default withRouter(CampaignList);
