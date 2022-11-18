import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import AddIcon from "@material-ui/icons/Add";
import type {
  CampaignGroupInput,
  CampaignGroupPage
} from "@spoke/spoke-codegen";
import type { History } from "history";
import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import type { MutationMap, QueryMap } from "../../network/types";
import { formatErrorMessage, loadData } from "../hoc/with-operations";
import AdminCampaignGroupList from "./components/AdminCampaignGroupList";

const useStyles = makeStyles((theme) => ({
  fab: {
    position: "absolute",
    bottom: theme.spacing(2),
    right: theme.spacing(2)
  }
}));

interface OuterProps {
  mutations: {
    saveCampaignGroups: (campaignGroups: CampaignGroupInput[]) => Promise<any>;
    deleteCampaignGroup: (campaignGroupId: string) => Promise<any>;
  };
  campaignGroups: Pick<ApolloQueryResult<unknown>, "loading" | "errors"> & {
    organization: {
      campaignGroups: CampaignGroupPage;
    };
  };
}

interface InnerProps extends OuterProps {
  match: any;
  history: History;
}

const AdminCampaignGroupEditor: React.FC<InnerProps> = (props) => {
  const classes = useStyles();

  const [editingCampaignGroup, setEditingCampaignGroup] = useState<
    CampaignGroupInput | undefined
  >(undefined);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const campaignGroups = (
    props?.campaignGroups?.organization?.campaignGroups?.edges ?? []
  ).map(({ node }) => node);

  const getGroup = (campaignGroupId: string) => {
    const matching = campaignGroups.find(
      (group) => group.id === campaignGroupId
    );
    if (matching) return { ...matching };
  };

  const handleCancelError = () => setErrorMessage(undefined);

  const handleClickAddCampaignGroup = () =>
    setEditingCampaignGroup({ name: "", description: "" });

  const handleEditCampaignGroup = (campaignGroupId: string) => {
    const campaignGroup = getGroup(campaignGroupId);
    if (campaignGroup) setEditingCampaignGroup(campaignGroup);
  };

  const handleCancelEditCampaignGroup = () =>
    setEditingCampaignGroup(undefined);

  const handleSaveCampaignGroup = async () => {
    if (!editingCampaignGroup) return;

    setIsWorking(true);
    try {
      const result = await props.mutations.saveCampaignGroups([
        editingCampaignGroup
      ]);
      if (result.errors) throw new Error(result.errors[0].message);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsWorking(false);
      handleCancelEditCampaignGroup();
    }
  };

  const handleDeleteCampaignGroup = async (campaignGroupId: string) => {
    setIsWorking(true);
    try {
      const result = await props.mutations.deleteCampaignGroup(campaignGroupId);
      if (result.errors) throw new Error(result.errors[0].message);
    } catch (error: any) {
      setErrorMessage(formatErrorMessage(error.message));
    } finally {
      setIsWorking(false);
    }
  };

  const createCampaignGroupEditorHandle = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (!editingCampaignGroup) return;
    setEditingCampaignGroup({
      ...editingCampaignGroup,
      [event.target.name]: event.target.value
    });
  };

  const editorAction =
    editingCampaignGroup?.id === undefined ? "Create" : "Edit";

  return (
    <>
      <AdminCampaignGroupList
        // organizationId={organizationId}
        campaignGroups={campaignGroups}
        onEditGroup={handleEditCampaignGroup}
        onDeleteGroup={handleDeleteCampaignGroup}
      />
      <Fab
        color="primary"
        className={classes.fab}
        disabled={isWorking}
        onClick={handleClickAddCampaignGroup}
      >
        <AddIcon />
      </Fab>
      <Dialog
        open={editingCampaignGroup !== undefined}
        fullWidth
        onClose={handleCancelEditCampaignGroup}
      >
        <DialogTitle>{editorAction} Campaign Group</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            value={editingCampaignGroup?.name}
            label="Name"
            autoFocus
            fullWidth
            onChange={createCampaignGroupEditorHandle}
          />
          <br />
          <br />
          <TextField
            name="description"
            label="Description"
            value={editingCampaignGroup?.description}
            multiline
            fullWidth
            onChange={createCampaignGroupEditorHandle}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEditCampaignGroup} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSaveCampaignGroup} color="primary">
            {editorAction}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorMessage !== undefined} onClose={handleCancelError}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorMessage || ""}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelError}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const queries: QueryMap<InnerProps> = {
  campaignGroups: {
    query: gql`
      query GetOrganizationCampaignGroups($organizationId: String!) {
        organization(id: $organizationId) {
          id
          campaignGroups {
            edges {
              node {
                id
                name
                description
              }
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations: MutationMap<InnerProps> = {
  saveCampaignGroups: (ownProps) => (campaignGroups: CampaignGroupInput[]) => ({
    mutation: gql`
      mutation SaveCampaignGroups(
        $organizationId: String!
        $campaignGroups: [CampaignGroupInput!]!
      ) {
        saveCampaignGroups(
          organizationId: $organizationId
          campaignGroups: $campaignGroups
        ) {
          id
          name
          description
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      campaignGroups
    },
    refetchQueries: ["GetOrganizationCampaignGroups"]
  }),
  deleteCampaignGroup: (ownProps) => (campaignGroupId: string) => ({
    mutation: gql`
      mutation DeleteCampaignGroup(
        $organizationId: String!
        $campaignGroupId: String!
      ) {
        deleteCampaignGroup(
          organizationId: $organizationId
          campaignGroupId: $campaignGroupId
        )
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      campaignGroupId
    },
    refetchQueries: ["GetOrganizationCampaignGroups"]
  })
};

export default compose(
  withRouter,
  loadData({
    queries,
    mutations
  })
)(AdminCampaignGroupEditor);
