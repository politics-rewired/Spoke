import { css, StyleSheet } from "aphrodite";
import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import CreateIcon from "material-ui/svg-icons/content/create";
import React from "react";
import { compose } from "recompose";

import { CannedResponse } from "../../../../api/canned-response";
import { LargeList } from "../../../../components/LargeList";
import { dataTest } from "../../../../lib/attributes";
import { MutationMap, QueryMap } from "../../../../network/types";
import theme from "../../../../styles/theme";
import { loadData } from "../../../hoc/with-operations";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../../components/SectionWrapper";
import CannedResponseRow from "./components/CannedResponseRow";
import CreateCannedResponseForm from "./components/CreateCannedResponseForm";

const styles = StyleSheet.create({
  formContainer: {
    ...theme.layouts.greenBox,
    maxWidth: "100%",
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    paddingLeft: 10,
    marginTop: 15,
    textAlign: "left"
  },
  form: {
    backgroundColor: theme.colors.white,
    padding: 10
  }
});

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
  isWorking: boolean;
  showForm: boolean;
}

class CampaignCannedResponsesForm extends React.Component<InnerProps, State> {
  state: State = {
    cannedResponsesToAdd: [],
    cannedResponseIdsToDelete: [],
    isWorking: false,
    showForm: false
  };

  pendingCannedResponses = () => {
    const { cannedResponsesToAdd, cannedResponseIdsToDelete } = this.state;
    const { cannedResponses } = this.props.data.campaign;
    const newCannedResponses = cannedResponses
      .filter((response) => !cannedResponseIdsToDelete.includes(response.id))
      .concat(cannedResponsesToAdd);
    const didChange = !isEqual(cannedResponses, newCannedResponses);
    return { cannedResponses: newCannedResponses, didChange };
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

  handleOnShowCreateForm = () => this.setState({ showForm: true });

  handleOnCancelCreateForm = () => this.setState({ showForm: false });

  handleOnSaveResponse = (response: CannedResponse) => {
    const newId = Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "");
    const cannedResponsesToAdd = this.state.cannedResponsesToAdd.concat({
      ...response,
      id: newId
    });
    this.setState({ cannedResponsesToAdd, showForm: false });
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

  render() {
    const { isWorking, showForm } = this.state;
    const {
      data: {
        campaign: { customFields }
      },
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
              />
            ))}
          </LargeList>
        ) : (
          <p>No canned responses</p>
        )}
        <hr />
        {showForm ? (
          <div className={css(styles.formContainer)}>
            <div className={css(styles.form)}>
              <CreateCannedResponseForm
                customFields={customFields}
                onCancel={this.handleOnCancelCreateForm}
                onSaveCannedResponse={this.handleOnSaveResponse}
              />
            </div>
          </div>
        ) : (
          <FlatButton
            {...dataTest("newCannedResponse")}
            secondary
            label="Add new canned response"
            icon={<CreateIcon />}
            onClick={this.handleOnShowCreateForm}
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
