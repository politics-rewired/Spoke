import React from "react";

import { List, ListItem } from "material-ui/List";
import Subheader from "material-ui/Subheader";
import CheckIcon from "material-ui/svg-icons/action/check-circle";

import { PendingJobType } from "../../../components/SectionWrapper";
import theme from "../../../../../styles/theme";
import { dataTest } from "../../../../../lib/attributes";

const GreenCheck = () => <CheckIcon color={theme.colors.green} />;

const inlineStyles = {
  nestedItem: {
    fontSize: "12px"
  }
};

interface Props {
  contactsCount: number;
  customFields: string[];
  pendingJob?: PendingJobType;
}

export const UploadResults: React.SFC<Props> = props => {
  const { contactsCount, customFields, pendingJob } = props;
  return (
    <List>
      {contactsCount > 0 && <Subheader>Uploaded</Subheader>}
      {contactsCount > 0 && (
        <ListItem
          {...dataTest("uploadedContacts")}
          primaryText={`${contactsCount} contacts`}
          leftIcon={<GreenCheck />}
        />
      )}
      {contactsCount > 0 && (
        <ListItem
          primaryText={`${customFields.length} custom fields`}
          leftIcon={<GreenCheck />}
          nestedItems={customFields.map(field => (
            <ListItem
              key={field}
              innerDivStyle={inlineStyles.nestedItem}
              primaryText={field}
            />
          ))}
        />
      )}
      {pendingJob && <Subheader>Upload Messages</Subheader>}
      {pendingJob && pendingJob.resultMessage.split("\n").length > 0 ? (
        pendingJob.resultMessage
          .split("\n")
          .map(message => <ListItem key={message} primaryText={message} />)
      ) : (
        <ListItem primaryText={"No results"} />
      )}
    </List>
  );
};

export default UploadResults;
