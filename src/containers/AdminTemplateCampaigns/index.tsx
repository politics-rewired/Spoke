import Fab from "@material-ui/core/Fab";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";
import {
  useCreateTemplateCampaignMutation,
  useGetTemplateCampaignsQuery
} from "@spoke/spoke-codegen";
import React, { useCallback } from "react";
import { useHistory, useParams } from "react-router-dom";

import TemplateCampaignRow from "./components/TemplateCampaignRow";

const useStyles = makeStyles((theme) => ({
  listContainer: {
    "& > *": {
      margin: theme.spacing(1)
    }
  },
  fab: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

export const AdminTemplateCampaigns: React.FC = () => {
  const classes = useStyles();
  const history = useHistory();
  const { organizationId } = useParams<{ organizationId: string }>();
  const { data, loading, error } = useGetTemplateCampaignsQuery({
    variables: { organizationId }
  });
  const [
    createTemplateCampaign,
    { loading: createTemplateLoading }
  ] = useCreateTemplateCampaignMutation();

  const templateCampaigns = (
    data?.organization?.templateCampaigns?.edges ?? []
  ).map(({ node }) => node);

  const handleClickCreateTemplate = useCallback(async () => {
    await createTemplateCampaign({ variables: { organizationId } });
  }, [createTemplateCampaign]);

  const createHandleClickEdit = (templateCampaignId: string) => () => {
    history.push(
      `/admin/${organizationId}/template-campaigns/${templateCampaignId}`
    );
  };

  return (
    <>
      {loading && "Loading..."}
      {error && <p>{error.message}</p>}
      {!loading && templateCampaigns.length === 0 && "No Campaigns"}
      <div className={classes.listContainer}>
        {templateCampaigns.map((templateCampaign) => (
          <TemplateCampaignRow
            key={templateCampaign.id}
            templateCampaign={templateCampaign}
            onClickEdit={createHandleClickEdit(templateCampaign.id)}
          />
        ))}
      </div>
      <Fab
        color="primary"
        className={classes.fab}
        aria-label="add"
        disabled={createTemplateLoading}
        onClick={handleClickCreateTemplate}
      >
        <AddIcon />
      </Fab>
    </>
  );
};

export default AdminTemplateCampaigns;
