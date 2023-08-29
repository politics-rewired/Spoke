import Chip from "@material-ui/core/Chip";
import { blue } from "@material-ui/core/colors";
import Divider from "@material-ui/core/Divider";
import Tooltip from "@material-ui/core/Tooltip";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import PeopleOutlineRoundedIcon from "@material-ui/icons/PeopleOutlineRounded";
import PersonOutlineRoundedIcon from "@material-ui/icons/PersonOutlineRounded";
import RecordVoiceOverIcon from "@material-ui/icons/RecordVoiceOver";
import type {
  CampaignListEntryFragment,
  ExternalSystem
} from "@spoke/spoke-codegen";
import React from "react";

const inlineStyles = {
  wrapper: {
    display: "flex",
    whiteSpace: "pre-wrap",
    alignItems: "center"
  },
  chip: {
    margin: "4px",
    padding: "4px",
    color: "#666666"
  }
};

interface CampaignDetailsProps {
  id: string;
  description: string;
  creatorName: string | null;
  isAutoAssignEligible: boolean;
  teams: CampaignListEntryFragment["teams"];
  campaignGroups: CampaignListEntryFragment["campaignGroups"];
  externalSystem: Pick<ExternalSystem, "name" | "type"> | null | undefined;
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({
  description,
  creatorName,
  externalSystem,
  isAutoAssignEligible,
  teams,
  campaignGroups
}) => {
  // display van configuration and auto assign eligible tags in divided section
  const showExtraTags = externalSystem || isAutoAssignEligible;

  const showCampaignGroupsTags =
    campaignGroups?.edges && campaignGroups.edges?.length > 0;

  return (
    <>
      <div style={inlineStyles.wrapper}>
        {creatorName ? (
          <Tooltip title="Created by">
            <Chip
              icon={<PersonOutlineRoundedIcon fontSize="small" />}
              label={creatorName}
              style={inlineStyles.chip}
              variant="outlined"
            />
          </Tooltip>
        ) : null}
        {teams.length > 0 ? (
          <Tooltip title="Teams">
            <Chip
              icon={<PeopleOutlineRoundedIcon fontSize="small" />}
              label={teams
                .map((team: Record<string, unknown>) => team.title)
                .join(", ")}
              style={inlineStyles.chip}
              variant="outlined"
            />
          </Tooltip>
        ) : null}
        {showCampaignGroupsTags ? (
          <Tooltip title="Campaigns">
            <Chip
              icon={<RecordVoiceOverIcon fontSize="small" />}
              label={campaignGroups.edges
                .map(({ node }: { node: Record<string, unknown> }) => node.name)
                .join(", ")}
              style={inlineStyles.chip}
              variant="outlined"
            />
          </Tooltip>
        ) : null}
      </div>
      <div style={inlineStyles.chip}>
        <Tooltip title="Description" placement="bottom-start">
          <div style={inlineStyles.wrapper}>
            <DescriptionOutlinedIcon
              fontSize="small"
              style={{ marginRight: "4px" }}
            />
            {description}
          </div>
        </Tooltip>
      </div>
      {showExtraTags ? (
        <>
          <Divider component="li" />

          <div style={{ marginTop: "8px" }}>
            {isAutoAssignEligible ? (
              <Chip
                icon={<LocalOfferOutlinedIcon fontSize="small" />}
                label="Auto-Assign Eligible"
                style={inlineStyles.chip}
              />
            ) : null}
            {externalSystem ? (
              <Chip
                icon={<LocalOfferOutlinedIcon fontSize="small" />}
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
