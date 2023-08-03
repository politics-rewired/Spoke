import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ArchiveIcon from "@material-ui/icons/Archive";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import UnarchiveIcon from "@material-ui/icons/Unarchive";
import type { CampaignListEntryFragment } from "@spoke/spoke-codegen";
import React, { useCallback, useState } from "react";

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
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);

  const {
    startOperation,
    archiveCampaign,
    unarchiveCampaign,
    campaign
  } = props;

  const handleClickMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
      setMenuAnchor(event.currentTarget),
    [setMenuAnchor]
  );

  const handleCloseMenu = useCallback(() => setMenuAnchor(null), [
    setMenuAnchor
  ]);

  return (
    <div>
      <IconButton aria-label="people-row-menu" onClick={handleClickMenu}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        onClose={handleCloseMenu}
        open={menuAnchor !== null}
      >
        <MenuItem onClick={startOperation("releaseUnsentMessages", campaign)}>
          Release Unsent Messages
        </MenuItem>
        <MenuItem
          onClick={startOperation("markForSecondPass", campaign, {
            excludeNewer: true,
            excludeRecentlyTexted: true,
            days: 3,
            hours: 0
          })}
        >
          Mark for a Second Pass
        </MenuItem>
        <MenuItem
          onClick={startOperation("releaseUnrepliedMessages", campaign, {
            ageInHours: 1
          })}
        >
          Release Unreplied Conversations
        </MenuItem>
        {!campaign.isArchived && (
          <MenuItem onClick={() => archiveCampaign(campaign.id)}>
            <ListItemIcon>
              <ArchiveIcon />
            </ListItemIcon>
            Archive Campaign
          </MenuItem>
        )}
        {campaign.isArchived && (
          <MenuItem onClick={() => unarchiveCampaign(campaign.id)}>
            <ListItemIcon>
              <UnarchiveIcon />
            </ListItemIcon>
            Unarchive Campaign
          </MenuItem>
        )}
        <MenuItem onClick={startOperation("deleteNeedsMessage", campaign)}>
          Delete Unmessaged Contacts
        </MenuItem>

        <MenuItem onClick={startOperation("unMarkForSecondPass", campaign)}>
          Un-Mark for Second Pass
        </MenuItem>
        <MenuItem
          onClick={startOperation(
            campaign.isAutoassignEnabled
              ? "turnAutoAssignOff"
              : "turnAutoAssignOn",
            campaign
          )}
        >
          {campaign.isAutoassignEnabled
            ? "Turn auto-assign OFF"
            : "Turn auto-assign ON"}
        </MenuItem>
      </Menu>
    </div>
  );
};

export default CampaignListMenu;
