import { Divider, Typography } from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import { green, orange } from "@material-ui/core/colors";
import CheckCircleOutlineRoundedIcon from "@material-ui/icons/CheckCircleOutlineRounded";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import React from "react";

type IconMap = {
  [key: string]: JSX.Element;
};

const CHIP_ICONS: IconMap = {
  "Not Started": <WarningRoundedIcon style={{ color: orange[300] }} />,
  "Unassigned Contacts": <WarningRoundedIcon style={{ color: orange[300] }} />,
  "Unsent Initial Messages": (
    <WarningRoundedIcon style={{ color: orange[300] }} />
  ),
  "All Contacts Assigned": (
    <CheckCircleOutlineRoundedIcon style={{ color: green[500] }} />
  ),
  "All Initials Sent": (
    <CheckCircleOutlineRoundedIcon style={{ color: green[500] }} />
  )
};

const inlineStyles = {
  wrapper: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center"
  },
  chip: {
    margin: "4px",
    padding: "4px",
    borderRadius: "2px"
  }
};

export type Tag = {
  title: string;
  backgroundColor?: string;
  color?: string;
};

interface CampaignHeaderProps {
  campaignTitle: string;
  campaignId: string;
  tags: Tag[];
  onClick: () => void;
}

const CampaignHeader = (props: CampaignHeaderProps) => {
  const { campaignTitle, campaignId, tags, onClick } = props;
  return (
    <div style={inlineStyles.wrapper}>
      <Typography
        variant="h5"
        onClick={onClick}
        style={{ margin: "4px", cursor: "pointer" }}
      >
        {campaignTitle}
      </Typography>
      <Typography variant="subtitle1" style={{ marginLeft: "8px" }}>
        id: {campaignId}
      </Typography>
      <Divider
        orientation="vertical"
        flexItem
        style={{ margin: "4px 8px 4px 8px" }}
      />
      {tags.map((tag) => {
        const Icon = CHIP_ICONS[tag.title] ?? null;
        // "Started" tag should have green background
        const tagStyle =
          tag.title === "Started"
            ? {
                backgroundColor: green[100]
              }
            : {
                border: "1px white"
              };
        return (
          <Chip
            key={tag.title}
            label={tag.title}
            icon={Icon}
            style={{
              ...inlineStyles.chip,
              ...tagStyle
            }}
            variant="outlined"
          />
        );
      })}
    </div>
  );
};

export default CampaignHeader;
