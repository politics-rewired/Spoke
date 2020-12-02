import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import isEqual from "lodash/isEqual";
import uniqBy from "lodash/uniqBy";

import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import CreateIcon from "material-ui/svg-icons/content/create";


import { CannedResponse } from "../../../../api/canned-response";
import { dataTest } from "../../../../lib/attributes";
import { MutationMap, QueryMap } from "../../../../network/types";
import theme from "../../../../styles/theme";
import { loadData } from "../../../hoc/with-operations";
import { LargeList } from "../../../../components/LargeList";
import CannedResponseRow from "./components/CannedResponseRow";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import {
  asSection,
  RequiredComponentProps
} from "../../components/SectionWrapper";
import CannedResponseDialog from "./components/CannedResponseDialog";
import { Values, State, InnerProps, ResponseEditorContext, ResponseEditKey } from "./interfaces";


class CampaignCannedResponsesForm extends React.Component<InnerProps, State> {
  state: State = {
    cannedResponsesToAdd: [],
    cannedResponseIdsToDelete: [],
    editedCannedResponses: [],
    isWorking: false,
    shouldShowEditor: false,
  };

  pendingCannedResponses = () => {
    const { cannedResponsesToAdd, cannedResponseIdsToDelete, editedCannedResponses } = this.state;
    const { cannedResponses } = this.props.data.campaign;
    const newCannedResponses = cannedResponses
      .filter((response) => !cannedResponseIdsToDelete.includes(response.id))
      .concat(cannedResponsesToAdd);
    const editingResponseIds = editedCannedResponses.map(resp => resp.id)
    
    // merge editedResponses and newCannedResponses 
    const newResponsesWithEdits = newCannedResponses.reduce((acc: CannedResponse[], response) => {
      if (editingResponseIds.includes(response.id)) {
        const editedResponse = editedCannedResponses.find(resp => resp.id === response.id);
        acc.push(editedResponse!)
      } else {
        acc.push(response)
      }
      return acc
    }, [])

    const didChange = !isEqual(cannedResponses, newResponsesWithEdits);
    return { cannedResponses: newResponsesWithEdits, didChange };
  };

  handleSubmit = async () => {
    const { editCampaign } = this.props.mutations;
    const { cannedResponses, didChange } = this.pendingCannedResponses();

    if (!didChange) return;

    this.setState({ isWorking: true });
    try {
      const response = await editCampaign({ cannedResponses });
      if (response.errors) throw response.errors;
      this.setState({
        cannedResponsesToAdd: [],
        cannedResponseIdsToDelete: []
      });
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleOnSaveResponse = (response: CannedResponse) => {
    const newId = Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "");
    const cannedResponsesToAdd = this.state.cannedResponsesToAdd.concat({
      ...response,
      id: newId
    });
    this.setState({ cannedResponsesToAdd, shouldShowEditor: false });
  };

  createHandleOnDelete = (responseId: string) => () => {
    const cannedResponsesToAdd = this.state.cannedResponsesToAdd.filter(
      (response) => response.id !== responseId
    );
    const cannedResponseIdsToDelete = [
      ...new Set(this.state.cannedResponseIdsToDelete).add(responseId)
    ];
    this.setState({
      cannedResponsesToAdd,
      cannedResponseIdsToDelete
    });
  };

  handleToggleResponseDialog = (responseId: string = "") => () => {
    const { cannedResponses } = this.pendingCannedResponses();
    const editingResponse = cannedResponses.find(res => res.id === responseId)
    this.setState({ shouldShowEditor: true, editingResponse });
    
  }

  handleOnEditResponse = (key: ResponseEditKey, value: string) => {
    const { editingResponse } = this.state
    const newResponse = {...editingResponse, [key]: value}

    // cast as CannedResponse to avoid {} missing properties id, text... 
    this.setState({ editingResponse: newResponse as CannedResponse })
  }

  // save edits to a canned response
  handleOnSaveResponseEdit = () => {
    const { editingResponse, editedCannedResponses } = this.state;
    const newResponses = uniqBy([editingResponse, ...editedCannedResponses], response => response!.id)

    // cast as CannedRespone[] to avoid obj possibly undefined
    this.setState({ editedCannedResponses: newResponses as CannedResponse[], editingResponse: undefined, shouldShowEditor: false })
  }

  // cancel editing and creating canned responses
  handleOnCancelResponseEdit = () => {
    this.setState({ editingResponse: undefined, shouldShowEditor: false})
  }

  renderCannedResponseDialog() {
    const { shouldShowEditor, editingResponse } = this.state;
    const {
      data: {
        campaign: { customFields }
      },
    } = this.props;

    const context = editingResponse ? ResponseEditorContext.EditingResponse : ResponseEditorContext.CreatingResponse;

    return (
      <CannedResponseDialog
        open={shouldShowEditor}
        context={context}
        customFields={customFields}
        editingResponse={editingResponse!}
        onCancel={this.handleOnCancelResponseEdit}
        onSaveCannedResponse={this.handleOnSaveResponse}
        onEditCannedResponse={this.handleOnEditResponse}
        onSaveResponseEdit={this.handleOnSaveResponseEdit}
      />
    )
  }

  render() {
    const { isWorking, shouldShowEditor } = this.state;
    const {
      isNew,
      saveLabel
    } = this.props;

    const {
      cannedResponses,
      didChange: hasPendingChanges
    } = this.pendingCannedResponses();
    const isSaveDisabled = isWorking || (!isNew && !hasPendingChanges);
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    return (
      <div>
        <CampaignFormSectionHeading
          title="Canned responses for texters"
          subtitle="Save some scripts for your texters to use to answer additional FAQs that may come up outside of the survey questions and scripts you already set up."
        />
        {cannedResponses.length > 0 ? (
          <LargeList>
            {cannedResponses.map((cannedResponse) => (
              <CannedResponseRow
                key={cannedResponse.id}
                cannedResponse={cannedResponse}
                onDelete={this.createHandleOnDelete(cannedResponse.id)}
                onToggleResponseEditor={this.handleToggleResponseDialog(cannedResponse.id)}
              />
            ))}
          </LargeList>
        ) : (
          <p>No canned responses</p>
        )}
        <hr />
        {shouldShowEditor ? (
          this.renderCannedResponseDialog()
        ) : (
          <FlatButton
            {...dataTest("newCannedResponse")}
            secondary
            label="Add new canned response"
            icon={<CreateIcon />}
            onClick={this.handleToggleResponseDialog()}
          />
        )}
        <br />
        <RaisedButton
          label={finalSaveLabel}
          disabled={isSaveDisabled}
          onClick={this.handleSubmit}
        />
      </div>
    );
  }
}

const queries: QueryMap<InnerProps> = {
  data: {
    query: gql`
      query getCampaignBasics($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          cannedResponses {
            id
            title
            text
          }
          isStarted
          customFields
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations: MutationMap<InnerProps> = {
  editCampaign: (ownProps) => (payload: Values) => ({
    mutation: gql`
      mutation editCampaignBasics(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          cannedResponses {
            id
            title
            text
          }
          isStarted
          customFields
          readiness {
            id
            basics
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      payload
    }
  })
};

export default compose<InnerProps, RequiredComponentProps>(
  asSection({
    title: "Canned Responses",
    readinessName: "cannedResponses",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: true
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignCannedResponsesForm);
