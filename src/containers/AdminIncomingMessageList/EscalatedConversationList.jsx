import React from "react";
import gql from "graphql-tag";

import loadData from "../hoc/load-data";
import AdminIncomingMessageList from ".";

const EscalatedConversationList = props => {
  return <AdminIncomingMessageList escalatedConvosOnly={true} {...props} />;
};

export default EscalatedConversationList;
