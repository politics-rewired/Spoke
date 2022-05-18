import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import EditIcon from "@material-ui/icons/Edit";
import type { TemplateCampaignFragment } from "@spoke/spoke-codegen";
import isEmpty from "lodash/isEmpty";
import type { ReactNode } from "react";
import React from "react";

import { DateTime } from "../../../lib/datetime";

const useStyles = makeStyles((theme) => ({
  campaignInfo: {
    display: "flex",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(1)
    }
  }
}));

export interface TemplateCampaignRowProps {
  templateCampaign: TemplateCampaignFragment;
  onClickEdit?: () => Promise<void> | void;
}

export const TemplateCampaignRow: React.FC<TemplateCampaignRowProps> = ({
  templateCampaign,
  onClickEdit
}) => {
  const classes = useStyles();

  const createdAt = DateTime.fromISO(
    templateCampaign.createdAt
  ).toLocaleString();

  const campaignGroupCount =
    templateCampaign.campaignGroups?.pageInfo.totalCount ?? 0;
  const teamCount = templateCampaign.teams.length;

  const chips: ReactNode[] = [];
  if (campaignGroupCount > 0) {
    chips.push(
      <Chip
        key="campaign-groups"
        label={`${campaignGroupCount} Campaign Groups`}
      />
    );
  }
  if (teamCount > 0) {
    chips.push(<Chip key="teams" label={`${teamCount} Teams`} />);
  }
  if (templateCampaign.isAssignmentLimitedToTeams) {
    chips.push(
      <Chip key="assignment-restriction" label="Assignment Limited to Teams" />
    );
  }

  return (
    <Card>
      <CardHeader
        title={templateCampaign.title}
        subheader={
          <>
            <span>
              {isEmpty(templateCampaign.description)
                ? "No description"
                : templateCampaign.description}
            </span>
            <br />
            <span>
              Created {createdAt} by {templateCampaign.creator?.displayName}
            </span>
          </>
        }
        action={
          <IconButton aria-label="edit" onClick={onClickEdit}>
            <EditIcon />
          </IconButton>
        }
      />
      {chips.length > 0 && (
        <CardContent>
          <div className={classes.campaignInfo}>{chips}</div>
        </CardContent>
      )}
    </Card>
  );
};

export default TemplateCampaignRow;
