import { Card } from "@material-ui/core";
import Checkbox from "@material-ui/core/Checkbox";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import type { CampaignListEntryFragment } from "@spoke/spoke-codegen";
import React from "react";
import { useHistory } from "react-router-dom";

import type { CampaignDetailsForExport } from "../../../components/ExportMultipleCampaignDataDialog";
import { dataTest } from "../../../lib/attributes";
import { DateTime } from "../../../lib/datetime";
import { makeCampaignHeaderTags } from "../utils";
import CampaignDetails from "./CampaignDetails";
import CampaignHeader from "./CampaignHeader";
import type { CampaignOperations } from "./CampaignListMenu";
import CampaignListMenu from "./CampaignListMenu";

interface Props extends CampaignOperations {
  organizationId: string;
  isAdmin: boolean;
  campaign: CampaignListEntryFragment;
  campaignDetailsForExport: CampaignDetailsForExport[];
  selectForExport: (details: CampaignDetailsForExport) => void;
}

export const CampaignListRow: React.FC<Props> = (props) => {
  const history = useHistory();
  const {
    organizationId,
    isAdmin,
    campaign,
    campaignDetailsForExport,
    selectForExport
  } = props;
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

  const dueBy = DateTime.fromISO(campaign.dueBy || "");
  const creatorName = campaign.creator ? campaign.creator.displayName : null;

  const headerTags = makeCampaignHeaderTags({
    isStarted,
    hasUnassignedContacts,
    hasUnsentInitialMessages,
    hasUnhandledMessages
  });

  const isCampaignSelected = campaignDetailsForExport.find(
    (selectedCampaign: CampaignDetailsForExport) =>
      selectedCampaign.id === campaign.id
  );

  const campaignUrl = `/admin/${organizationId}/campaigns/${campaign.id}${
    isStarted ? "" : "/edit"
  }`;
  return (
    <Card
      variant="outlined"
      style={{ marginBottom: 16, ...(isArchived && { opacity: 0.6 }) }}
    >
      <ListItem {...dataTest("campaignRow")} alignItems="flex-start">
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={!!isCampaignSelected}
            tabIndex={-1}
            disableRipple
            onClick={() =>
              selectForExport({ id: campaign.id, title: campaign.title })
            }
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <CampaignHeader
              campaignTitle={campaign.title}
              campaignId={campaign.id}
              tags={headerTags}
              onClick={() => history.push(campaignUrl)}
            />
          }
          secondary={
            <CampaignDetails
              id={campaign.id}
              description={campaign.description}
              dueBy={dueBy}
              creatorName={creatorName}
              teams={teams}
              campaignGroups={campaignGroups}
              externalSystem={externalSystem}
              isAutoAssignEligible={
                isStarted && !isArchived && isAutoassignEnabled
              }
            />
          }
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
    </Card>
  );
};

export default CampaignListRow;
