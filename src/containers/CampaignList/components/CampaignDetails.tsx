import Chip from "@material-ui/core/Chip";
import { blue, orange } from "@material-ui/core/colors";
import Divider from "@material-ui/core/Divider";
import type { Theme } from "@material-ui/core/styles";
import { useTheme } from "@material-ui/core/styles";
import AssignmentRoundedIcon from "@material-ui/icons/AssignmentRounded";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import PeopleOutlineRoundedIcon from "@material-ui/icons/PeopleOutlineRounded";
import PersonOutlineRoundedIcon from "@material-ui/icons/PersonOutlineRounded";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
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
  chip: {
    margin: "4px",
    padding: "4px",
    border: "1px white"
  }
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

const makeDueByLabel = (dueBy: DateTime, isPastDue: boolean): string => {
  if (!dueBy.isValid) {
    return "No due date set";
  }
  return isPastDue
    ? `Past due ${dueBy.toFormat("DD")}`
    : `Due ${dueBy.toFormat("DD")}`;
};

const DueByIcon: React.FC<DueByIconProps> = (props) => {
  const { dueBy, theme } = props;
  const isPastDue = DateTime.local() >= dueBy;

  const label = makeDueByLabel(dueBy, isPastDue);
  const chipStyle = isPastDue
    ? {
        margin: "4px",
        color: orange[300]
      }
    : { margin: "4px", color: theme.palette.grey[900] };
  const iconStyle = isPastDue
    ? { color: orange[300] }
    : { color: theme.palette.grey[900] };
  return (
    <Chip
      icon={<ScheduleRoundedIcon style={iconStyle} />}
      label={label}
      style={{
        ...inlineStyles.chip,
        ...chipStyle
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

  // display van configuration and auto assign eligible tags in divided section
  const shouldShowExtraTags = externalSystem || isAutoAssignEligible;

  return (
    <>
      <div style={inlineStyles.wrapper}>
        {creatorName ? (
          <Chip
            icon={<PersonOutlineRoundedIcon />}
            label={creatorName}
            style={inlineStyles.chip}
            variant="outlined"
          />
        ) : null}
        <DueByIcon dueBy={dueBy} theme={theme} />
        {teams.length > 0 ? (
          <Chip
            icon={<PeopleOutlineRoundedIcon />}
            label={teams
              .map((team: Record<string, unknown>) => team.title)
              .join(", ")}
            style={inlineStyles.chip}
            variant="outlined"
          />
        ) : null}
        {campaignGroups?.edges.length > 0 ? (
          <Chip
            icon={<AssignmentRoundedIcon />}
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
