import React from "react";

import AdminIncomingMessageList from ".";

const EscalatedConversationList = (props) => {
  return <AdminIncomingMessageList escalatedConvosOnly {...props} />;
};

export default EscalatedConversationList;
