import IconButton from "@material-ui/core/IconButton";
import ArchiveIcon from "@material-ui/icons/Archive";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import UnarchiveIcon from "@material-ui/icons/Unarchive";
import type { CampaignListEntryFragment } from "@spoke/spoke-codegen";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import React from "react";

type ClickHandler = () => void | Promise<void>;

export interface CampaignOperations {
  startOperation: (
    action: string,
    campaign: CampaignListEntryFragment,
    payload?: any
  ) => ClickHandler;
  archiveCampaign: (campaignId: string) => ClickHandler;
  unarchiveCampaign: (campaignId: string) => ClickHandler;
}

interface Props extends CampaignOperations {
  campaign: CampaignListEntryFragment;
}

export const CampaignListMenu: React.FC<Props> = (props) => {
  const {
    startOperation,
    archiveCampaign,
    unarchiveCampaign,
    campaign
  } = props;

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
          excludeNewer: true,
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
};

export default CampaignListMenu;
