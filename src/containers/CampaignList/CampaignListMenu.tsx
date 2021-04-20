import IconButton from "material-ui/IconButton";
import IconMenu from "material-ui/IconMenu";
import MenuItem from "material-ui/MenuItem";
import ArchiveIcon from "material-ui/svg-icons/content/archive";
import UnarchiveIcon from "material-ui/svg-icons/content/unarchive";
import MoreVertIcon from "material-ui/svg-icons/navigation/more-vert";
import React from "react";

import { Campaign } from "../../api/campaign";

type ClickHandler = () => void | Promise<void>;

export interface CampaignOperations {
  startOperation: (
    action: string,
    campaign: Campaign,
    payload?: any
  ) => ClickHandler;
  archiveCampaign: (campaignId: string) => ClickHandler;
  unarchiveCampaign: (campaignId: string) => ClickHandler;
}

interface Props extends CampaignOperations {
  campaign: Campaign;
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
