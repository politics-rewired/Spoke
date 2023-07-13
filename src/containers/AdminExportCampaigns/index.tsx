import React from "react";
import { useHistory, useParams } from "react-router-dom";

const AdminExportCampaigns: React.FC = () => {
  // const classes = useStyles();
  const _history = useHistory();
  const { organizationId: _orgId } = useParams<{ organizationId: string }>();

  return <div>TODO</div>;
};

export default AdminExportCampaigns;
