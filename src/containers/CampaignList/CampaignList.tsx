import List from "@material-ui/core/List";
import SpeakerNotesIcon from "@material-ui/icons/SpeakerNotes";
import React from "react";

import { Campaign } from "../../api/campaign";
import Empty from "../../components/Empty";
import { CampaignOperations } from "./CampaignListMenu";
import CampaignListRow from "./CampaignListRow";

interface Props extends CampaignOperations {
  organizationId: string;
  campaigns: Campaign[];
  isAdmin: boolean;
}

export const CampaignList: React.FC<Props> = (props) => {
  if (props.campaigns.length === 0) {
    return <Empty title="No campaigns" icon={<SpeakerNotesIcon />} />;
  }

  return (
    <List>
      {props.campaigns.map((campaign) => (
        <CampaignListRow
          key={campaign.id}
          organizationId={props.organizationId}
          isAdmin={props.isAdmin}
          campaign={campaign}
          startOperation={props.startOperation}
          archiveCampaign={props.archiveCampaign}
          unarchiveCampaign={props.unarchiveCampaign}
        />
      ))}
    </List>
  );
};

export default CampaignList;
