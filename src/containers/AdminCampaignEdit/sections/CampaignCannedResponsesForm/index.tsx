import { css, StyleSheet } from "aphrodite";
import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import { compose } from "recompose";
import { StyleSheet, css } from "aphrodite";
import isEqual from "lodash/isEqual";
import uniqBy from "lodash/uniqBy";

import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import CreateIcon from "material-ui/svg-icons/content/create";
import React from "react";
import { compose } from "recompose";

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
  FullComponentProps,
  RequiredComponentProps
} from "../../components/SectionWrapper";
import CannedResponseDialog, { ResponseEditorContext } from "./components/CannedResponseDialog";
import { ResponseEditKey } from "./components/CannedResponseEditor";


interface Values {
  cannedResponses: CannedResponse[];
}

interface HocProps {
  mutations: {
    editCampaign(payload: Values): ApolloQueryResult<any>;
  };
  data: {
    campaign: {
      id: string;
      cannedResponses: CannedResponse[];
      isStarted: boolean;
      customFields: string[];
    };
  };
}

interface InnerProps extends FullComponentProps, HocProps {}

interface State {
  cannedResponsesToAdd: CannedResponse[];
  cannedResponseIdsToDelete: string[];
  editedCannedResponses: CannedResponse[];
  editedResponse: EditedResponse;
  isWorking: boolean;
  showEditor: boolean;
}

type EditedResponse = CannedResponse | undefined;

class CampaignCannedResponsesForm extends React.Component<InnerProps, State> {
  state: State = {
    cannedResponsesToAdd: [],
    cannedResponseIdsToDelete: [],
    editedCannedResponses: [],
    editedResponse: undefined,
    isWorking: false,
    showEditor: false,
  };

  pendingCannedResponses = () => {
    const { cannedResponsesToAdd, cannedResponseIdsToDelete, editedCannedResponses } = this.state;
    const { cannedResponses } = this.props.data.campaign;
    const newCannedResponses = cannedResponses
      .filter((response) => !cannedResponseIdsToDelete.includes(response.id))
      .concat(cannedResponsesToAdd);
    const editedResponseIds = editedCannedResponses.map(resp => resp.id)
    const newResponsesWithEdits = newCannedResponses.reduce((acc: CannedResponse[], response) => {
      if (editedResponseIds.includes(response.id)) {
        const editedReponse = editedCannedResponses.find(resp => resp.id === response.id);
        acc.push(editedReponse as CannedResponse)
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

  handleOnCancelCreateForm = () => this.setState({ showEditor: false });

  handleOnSaveResponse = (response: CannedResponse) => {
    const newId = Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "");
    const cannedResponsesToAdd = this.state.cannedResponsesToAdd.concat({
      ...response,
      id: newId
    });
    this.setState({ cannedResponsesToAdd, showEditor: false });
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
    const editedResponse = cannedResponses.find(res => res.id === responseId)
    this.setState({ showEditor: true, editedResponse });
    
  }

  handleOnEditResponse = (key: ResponseEditKey, value: string) => {
    const { editedResponse } = this.state
    const newResponse = {...editedResponse, [key]: value}

    // cast as CannedResponse to avoid {} missing properties id, text... 
    this.setState({ editedResponse: newResponse as CannedResponse })
  }

  handleOnSaveResponseEdit = () => {
    const { editedResponse, editedCannedResponses } = this.state;
    const newResponses = uniqBy([editedResponse, ...editedCannedResponses], response => (response as CannedResponse).id)
    this.setState({ editedCannedResponses: newResponses as CannedResponse[], editedResponse: undefined, showEditor: false })
  }

  handleOnCancelResponseEdit = () => {
    this.setState({ editedResponse: undefined, showEditor: false})
  }

  renderCannedResponseDialog() {
    const { showEditor, editedResponse } = this.state;
    const {
      data: {
        campaign: { customFields }
      },
    } = this.props;

    const context = editedResponse ? ResponseEditorContext.EditingResponse : ResponseEditorContext.CreatingResponse;

    return (
      <CannedResponseDialog
        open={showEditor}
        context={context}
        customFields={customFields}
        editedResponse={editedResponse}
        onCancel={this.handleOnCancelCreateForm}
        onSaveCannedResponse={this.handleOnSaveResponse}
        onEditCannedResponse={this.handleOnEditResponse}
        onSaveResponseEdit={this.handleOnSaveResponseEdit}
        onCancelResponseEdit={this.handleOnCancelResponseEdit}
      />
    )
  }

  render() {
    const { isWorking, showEditor } = this.state;
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
        {showEditor ? (
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
