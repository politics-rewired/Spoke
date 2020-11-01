import React from "react";

import AdminIncomingMessageList from ".";

const EscalatedConversationList = (props) => {
  return <AdminIncomingMessageList escalatedConvosOnly={true} {...props} />;
};

export default EscalatedConversationList;
