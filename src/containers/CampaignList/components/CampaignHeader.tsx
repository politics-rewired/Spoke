import { Divider, Typography } from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import React from "react";

const inlineStyles = {
  wrapper: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center"
  },
  chip: {
    margin: "4px",
    padding: "4px"
  }
};

export type Tag = {
  title: string;
  status: string;
};

interface CampaignHeaderProps {
  campaignTitle: string;
  campaignId: string;
  tags: Tag[];
  onClick: () => void;
}

const CampaignHeader: React.FC<CampaignHeaderProps> = ({
  campaignTitle,
  campaignId,
  tags,
  onClick
}) => {
  return (
    <div style={inlineStyles.wrapper}>
      <Typography
        variant="h6"
        onClick={onClick}
        style={{ margin: "4px", cursor: "pointer" }}
      >
        {campaignTitle}
      </Typography>
      <Typography
        variant="subtitle1"
        style={{ marginLeft: "8px", color: "#666666" }}
      >
        ID: {campaignId}
      </Typography>
      <Divider
        orientation="vertical"
        flexItem
        style={{ margin: "4px 8px 4px 8px" }}
      />
      {tags.map((tag) => {
        // display check or alert icon
        const Icon =
          tag.status === "success" ? (
            <CheckCircleIcon fontSize="small" style={{ color: "#4caf50" }} />
          ) : (
            <ErrorIcon fontSize="small" style={{ color: "#FF781D" }} />
          );
        // display green or orange background
        const backgroundColor =
          tag.status === "success"
            ? {
                backgroundColor: "#DFF0DF"
              }
            : {
                backgroundColor: "#FFF2E9"
              };
        return (
          <Chip
            key={tag.title}
            label={tag.title}
            icon={Icon}
            style={{ ...inlineStyles.chip, ...backgroundColor }}
          />
        );
      })}
    </div>
  );
};

export default CampaignHeader;
