import { Divider, Typography } from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import CheckIcon from "@material-ui/icons/Check";
import WarningIcon from "@material-ui/icons/Warning";
import React from "react";

type IconMap = {
  [key: string]: JSX.Element;
};

const CHIP_ICONS: IconMap = {
  "Not started": <WarningIcon />,
  "Unassigned contacts": <WarningIcon />,
  "Unsent initial messages": <WarningIcon />,
  "All contacts assigned": <CheckIcon />,
  "All initials sent": <CheckIcon />
};

const inlineStyles = {
  wrapper: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center"
  },
  chip: { margin: "4px", padding: "4px" }
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
        return (
          <Chip
            key={tag.title}
            label={tag.title}
            icon={Icon}
            style={{
              ...inlineStyles.chip,
              color: tag.color,
              backgroundColor: tag.backgroundColor
            }}
            variant="outlined"
          />
        );
      })}
    </div>
  );
};

export default CampaignHeader;
