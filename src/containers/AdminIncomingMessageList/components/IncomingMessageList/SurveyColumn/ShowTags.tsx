import Chip from "@material-ui/core/Chip";
import type { CampaignContactTag } from "@spoke/spoke-codegen";
import React from "react";

interface CampaignContactTagWithLabel extends CampaignContactTag {
  tagLabel: string;
}

export interface ShowTagsProps {
  tags: Array<CampaignContactTagWithLabel>;
}

const ShowTags: React.FC<ShowTagsProps> = ({ tags }) => (
  <div>
    <h2>Contact Tags</h2>
    {tags.map((tag: CampaignContactTagWithLabel) => (
      <Chip
        key={tag.tag.id}
        style={{
          marginLeft: 5,
          marginRight: 5,
          paddingLeft: 5,
          paddingRight: 5,
          backgroundColor: tag.tag.backgroundColor,
          color: tag.tag.textColor
        }}
        label={tag.tagLabel}
      />
    ))}
  </div>
);

export default ShowTags;
