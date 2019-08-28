import React from "react";
import PropTypes from "prop-types";

import ManageSurveyResponses from "./ManageSurveyResponses";
import ManageTags from "./ManageTags";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  spacer: { flex: "1" }
};

const SurveyColumn = props => {
  const { campaign, contact, organizationId } = props;
  return (
    <div style={styles.container}>
      <ManageSurveyResponses contact={contact} campaign={campaign} />
      <div style={styles.spacer} />
      <ManageTags organizationId={organizationId} contactId={contact.id} />
    </div>
  );
};

SurveyColumn.propTypes = {
  campaign: PropTypes.object.isRequired,
  contact: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired
};

export default SurveyColumn;
