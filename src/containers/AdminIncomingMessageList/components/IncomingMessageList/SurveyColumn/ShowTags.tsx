import Chip from "@material-ui/core/Chip";
import type { CampaignContact, CampaignContactTag } from "@spoke/spoke-codegen";
import React from "react";

export interface ShowTagsProps {
  contact: CampaignContact;
}

const ShowTags: React.FC<ShowTagsProps> = ({ contact }) => {
  const tagLabel = (tag: CampaignContactTag) =>
    `${tag.tag.title} (${tag.tagger.firstName} ${tag.tagger.lastName}, ${tag.tagger.email})`;
  return (
    <div>
      <h2>Contact Tags</h2>
      {contact.tags.map((tag: CampaignContactTag) => (
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
          label={tagLabel(tag)}
        />
      ))}
    </div>
  );
};

export default ShowTags;
