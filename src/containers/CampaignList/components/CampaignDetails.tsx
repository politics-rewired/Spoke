import Chip from "@material-ui/core/Chip";
import { blue, yellow } from "@material-ui/core/colors";
import Divider from "@material-ui/core/Divider";
import type { Theme } from "@material-ui/core/styles";
import { useTheme } from "@material-ui/core/styles";
import GroupWorkOutlinedIcon from "@material-ui/icons/GroupWorkOutlined";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import ScheduleIcon from "@material-ui/icons/Schedule";
import type {
  CampaignListEntryFragment,
  ExternalSystem
} from "@spoke/spoke-codegen";
import React from "react";

import { DateTime } from "../../../lib/datetime";

const inlineStyles = {
  wrapper: {
    display: "flex",
    whiteSpace: "pre-wrap",
    alignItems: "center"
  },
  chip: { margin: "4px", padding: "4px" }
};

interface CampaignDetailsProps {
  id: string;
  description: string;
  creatorName: string | null;
  dueBy: DateTime;
  isAutoassignEligible: boolean;
  teams: CampaignListEntryFragment["teams"];
  campaignGroups: CampaignListEntryFragment["campaignGroups"];
  externalSystem: Pick<ExternalSystem, "name" | "type"> | null | undefined;
}

interface DueByIconProps {
  dueBy: DateTime;
  theme: Theme;
}

const DueByIcon: React.FC<DueByIconProps> = (props) => {
  const { dueBy, theme } = props;
  const pastDue = DateTime.local() >= dueBy;

  const label = dueBy.isValid
    ? pastDue
      ? `past due ${dueBy.toFormat("DD")}`
      : `due ${dueBy.toFormat("DD")}`
    : "No due date set";
  const style = pastDue
    ? {
        margin: "4px",
        color: theme.palette.grey[900],
        backgroundColor: yellow[300]
      }
    : { margin: "4px", color: theme.palette.grey[900] };
  return (
    <Chip
      icon={<ScheduleIcon />}
      label={label}
      style={{
        ...inlineStyles.chip,
        ...style
      }}
      variant="outlined"
    />
  );
};

const CampaignDetails: React.FC<CampaignDetailsProps> = (props) => {
  const {
    description,
    creatorName,
    dueBy,
    externalSystem,
    isAutoAssignEligible,
    teams,
    campaignGroups
  } = props;
  const theme = useTheme();

  const shouldShowExtraTags = externalSystem || isAutoAssignEligible;

  return (
    <>
      <div style={inlineStyles.wrapper}>
        {creatorName ? (
          <Chip
            icon={<PersonOutlineIcon />}
            label={creatorName}
            style={inlineStyles.chip}
            variant="outlined"
          />
        ) : null}
        <DueByIcon dueBy={dueBy} theme={theme} />
        {teams.length > 0 ? (
          <Chip
            icon={<PeopleAltOutlinedIcon />}
            label={teams
              .map((team: Record<string, unknown>) => team.title)
              .join(", ")}
            style={inlineStyles.chip}
            variant="outlined"
          />
        ) : null}
        {campaignGroups.length > 0 ? (
          <Chip
            icon={<GroupWorkOutlinedIcon />}
            label={campaignGroups.edges
              .map(({ node }: { node: Record<string, unknown> }) => node.name)
              .join(", ")}
            style={inlineStyles.chip}
            variant="outlined"
          />
        ) : null}
      </div>
      <div style={inlineStyles.chip}>Description: {description}</div>
      {shouldShowExtraTags ? (
        <>
          <Divider component="li" />

          <div style={{ marginTop: "8px" }}>
            {isAutoAssignEligible ? (
              <Chip
                icon={<LocalOfferOutlinedIcon />}
                label="Auto-Assign Eligible"
                style={inlineStyles.chip}
              />
            ) : null}
            {externalSystem ? (
              <Chip
                icon={<LocalOfferOutlinedIcon />}
                label={`${externalSystem.type}: ${externalSystem.name}`}
                style={{ ...inlineStyles.chip, backgroundColor: blue[300] }}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );
};

export default CampaignDetails;
