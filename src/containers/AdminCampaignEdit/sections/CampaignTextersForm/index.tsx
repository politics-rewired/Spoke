import { css, StyleSheet } from "aphrodite";
import { ApolloQueryResult } from "apollo-client/core/types";
import gql from "graphql-tag";
import orderBy from "lodash/orderBy";
import uniqBy from "lodash/uniqBy";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import { red600 } from "material-ui/styles/colors";
import React from "react";
import { compose } from "recompose";
import * as yup from "yup";

import { Campaign } from "../../../../api/campaign";
import { User } from "../../../../api/user";
import GSForm from "../../../../components/forms/GSForm";
import { DateTime } from "../../../../lib/datetime";
import { MutationMap, QueryMap } from "../../../../network/types";
import theme from "../../../../styles/theme";
import { loadData } from "../../../hoc/with-operations";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../../components/SectionWrapper";
import CampaignTextersManager from "./components/CampaignTextersManager";
import TexterAssignmentDisplay from "./components/TexterAssignmentDisplay";
import TextersAssignmentManager from "./components/TextersAssignmentManager";
import { Texter } from "./types";
import { assignTexterContacts, handleExtraTexterCapacity } from "./utils";

const styles = StyleSheet.create({
  sliderContainer: {
    border: `1px solid ${theme.colors.lightGray}`,
    padding: 10,
    borderRadius: 8
  }
});

const inlineStyles = {
  button: {
    display: "inline-block",
    marginTop: 15
  }
};

interface HocProps {
  mutations: {
    editCampaign(payload: Values): ApolloQueryResult<any>;
  };
  campaignData: {
    campaign: Pick<Campaign, "id" | "isStarted" | "dueBy" | "contactsCount"> & {
      texters: Texter[];
    };
    refetch(): void;
  };
  organizationData: {
    organization: {
      id: string;
      texters: Pick<User, "id" | "firstName" | "lastName" | "displayName">[];
    };
  };
}

interface State {
  autoSplit: boolean;
  upsertedTexters: Texter[];
  textersToRemoveIds: string[];
  searchText: string;
  snackbarOpen: boolean;
  snackbarMessage: string;
  isWorking: boolean;
}

interface InnerProps extends FullComponentProps, HocProps {
  orgTexters: any[];
  organizationId: string;
  contactsCount: number;
  saveLabel: string;
  saveDisabled: boolean;
}

interface Values {
  texters: any[];
}

class CampaignTextersForm extends React.Component<InnerProps, State> {
  state: State = {
    autoSplit: false,
    upsertedTexters: [],
    textersToRemoveIds: [],
    searchText: "",
    snackbarOpen: false,
    snackbarMessage: "",
    isWorking: false
  };

  formSchema = yup.object({
    texters: yup.array().of(
      yup.object({
        id: yup.string(),
        assignment: yup.object({
          needsMessageCount: yup.number(),
          maxContacts: yup.number().nullable()
        })
      })
    )
  });

  collectFormValues = () => {
    const { upsertedTexters: editedTexters, textersToRemoveIds } = this.state;
    const { texters } = this.props.campaignData.campaign;
    const deletedTexterIds: string[] = textersToRemoveIds;
    const editedTexterIds = editedTexters.map((t) => t.id);
    const unorderedTexters = texters
      .filter((texter) => !editedTexterIds.includes(texter.id))
      .concat(editedTexters)
      .filter((texter) => !deletedTexterIds.includes(texter.id));

    const orderedTexters = orderBy(
      unorderedTexters,
      ["firstName", "lastName"],
      ["asc", "asc"]
    );
    return {
      texters: orderedTexters
    };
  };

  addTexter = (newTexter: Texter) => {
    const { upsertedTexters, textersToRemoveIds } = this.state;
    const newIdsToRemove = textersToRemoveIds.filter(
      (id) => id !== newTexter.id
    );
    const prevTexters = upsertedTexters.filter((t) => t.id !== newTexter.id);
    const newTexters = [newTexter, ...prevTexters];
    this.setState({
      upsertedTexters: newTexters,
      searchText: "",
      textersToRemoveIds: newIdsToRemove
    });
  };

  addAllTexters = () => {
    const { texters: orgTexters } = this.props.organizationData.organization;
    const { texters } = this.collectFormValues();

    const upsertedTexters = orgTexters.map((orgTexter) => {
      const { id, firstName } = orgTexter;
      const newTexter = {
        id,
        firstName,
        assignment: {
          contactsCount: 0,
          messagedCount: 0,
          needsMessageCount: 0,
          maxContacts: 0
        }
      };
      const currentlyAddedTexter = texters.find((t) => t.id === id);
      return currentlyAddedTexter || newTexter;
    });

    this.setState({ upsertedTexters, textersToRemoveIds: [] });
  };

  handleSearchTexters = (searchText: string) => {
    this.setState({ searchText });
  };

  handleAssignContacts = (assignedContacts: number, texterId: string) => {
    const { texters } = this.collectFormValues();
    const { contactsCount } = this.props.campaignData.campaign;
    const editedTexter = texters.find((t) => t.id === texterId);
    if (!editedTexter) return;

    let totalNeedsMessage = 0;
    let totalMessaged = 0;

    const texterWithContacts = assignTexterContacts(
      editedTexter,
      assignedContacts,
      contactsCount
    );

    totalNeedsMessage += texterWithContacts.assignment.needsMessageCount;
    totalMessaged += texterWithContacts.assignment.messagedCount;

    const extraTexterCapacity =
      totalNeedsMessage + totalMessaged - contactsCount;

    if (extraTexterCapacity > 0) {
      handleExtraTexterCapacity(texterWithContacts, extraTexterCapacity);
      this.setState({
        snackbarOpen: true,
        snackbarMessage: `${editedTexter.assignment.contactsCount} contact${
          editedTexter.assignment.contactsCount === 1 ? "" : "s"
        } assigned to ${editedTexter.firstName}`
      });
    }

    const newTexters = uniqBy(
      [texterWithContacts, ...texters],
      (texter) => texter.id
    );
    this.setState({
      upsertedTexters: newTexters
    });
  };

  handleRemoveTexter = (texterId: string) => {
    const { textersToRemoveIds } = this.state;
    const newIds = [...textersToRemoveIds, texterId];
    this.setState({ textersToRemoveIds: newIds });
  };

  removeEmptyTexters = () => {
    const { texters } = this.collectFormValues();
    const newTexters = texters.filter(
      (t) =>
        t.assignment.contactsCount !== 0 || t.assignment.needsMessageCount !== 0
    );
    this.setState({ upsertedTexters: newTexters });
  };

  handleSubmit = async () => {
    const { editCampaign } = this.props.mutations;
    const { texters } = this.collectFormValues();
    const texterInput = texters.map((t) => ({
      id: t.id,
      needsMessageCount: t.assignment.needsMessageCount,
      maxContacts: t.assignment.maxContacts,
      contactsCount: t.assignment.contactsCount
    }));

    this.setState({ isWorking: true });
    try {
      const response = await editCampaign({ texters: texterInput });
      if (response.errors) throw response.errors;
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.props.campaignData.refetch();
      this.setState({
        isWorking: false,
        upsertedTexters: [],
        textersToRemoveIds: []
      });
    }
  };

  handleSplitAssignmentsToggle = (_ev: any, toggled: boolean) =>
    this.setState({ autoSplit: toggled }, () => {
      if (!this.state.autoSplit) return;

      const { texters } = this.collectFormValues();
      let { contactsCount } = this.props.campaignData.campaign;
      if (!contactsCount) return;
      contactsCount = Math.floor(contactsCount / texters.length);
      const newTexters = texters.map((texter) => ({
        ...texter,
        assignment: {
          ...texter.assignment,
          contactsCount
        }
      }));
      this.setState({ upsertedTexters: newTexters });
    });

  handleSnackbarClose = () =>
    this.setState({ snackbarOpen: false, snackbarMessage: "" });

  render() {
    const {
      saveLabel,
      saveDisabled,
      campaignData,
      organizationData
    } = this.props;
    const {
      searchText,
      autoSplit,
      snackbarOpen,
      snackbarMessage,
      isWorking
    } = this.state;
    const { contactsCount, dueBy } = campaignData.campaign;
    const { texters: orgTexters } = organizationData.organization;
    const availableTexters = this.collectFormValues().texters;
    const assignedContacts = availableTexters.reduce(
      (prev, texter) => prev + texter.assignment.contactsCount,
      0
    );

    const shouldShowTextersManager = orgTexters.length > 0;
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;
    const isOverdue = DateTime.local() >= DateTime.fromISO(dueBy);
    const finalSaveDisabled = isOverdue || saveDisabled;

    return (
      <div>
        <CampaignFormSectionHeading
          title="Who should send the texts?"
          subtitle={
            isOverdue && (
              <span style={{ color: red600 }}>
                This campaign is overdue! Please change the due date before
                editing Texters
              </span>
            )
          }
        />
        <GSForm schema={this.formSchema} value={this.collectFormValues()}>
          {shouldShowTextersManager && (
            <CampaignTextersManager
              texters={availableTexters}
              orgTexters={orgTexters}
              searchText={searchText}
              handleSearchTexters={this.handleSearchTexters}
              addTexter={this.addTexter}
              addAllTexters={this.addAllTexters}
              removeEmptyTexters={this.removeEmptyTexters}
            />
          )}
          <div className={css(styles.sliderContainer)}>
            <TexterAssignmentDisplay
              assignedContacts={assignedContacts}
              contactsCount={contactsCount}
              toggled={autoSplit}
              handleSplitAssignmentsToggle={this.handleSplitAssignmentsToggle}
            />
            <TextersAssignmentManager
              texters={availableTexters}
              orgTexters={orgTexters}
              contactsCount={contactsCount}
              handleAssignContacts={this.handleAssignContacts}
              handleRemoveTexter={this.handleRemoveTexter}
            />
          </div>
        </GSForm>
        <RaisedButton
          label={finalSaveLabel}
          disabled={finalSaveDisabled}
          onClick={this.handleSubmit}
          style={inlineStyles.button}
        />
        <Snackbar
          open={snackbarOpen}
          message={snackbarMessage}
          autoHideDuration={3000}
          onRequestClose={this.handleSnackbarClose}
        />
      </div>
    );
  }
}

const queries: QueryMap<InnerProps> = {
  campaignData: {
    query: gql`
      query getCampaignBasics($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          texters {
            id
            firstName
            lastName
            displayName
            assignment(campaignId: $campaignId) {
              contactsCount
              needsMessageCount: contactsCount(
                contactsFilter: { messageStatus: "needsMessage" }
              )
              maxContacts
            }
          }
          contactsCount
          isStarted
          dueBy
          readiness {
            id
            basics
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          texters: people {
            id
            firstName
            lastName
            displayName
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      }
    })
  }
};

const mutations: MutationMap<InnerProps> = {
  editCampaign: (ownProps) => (payload: Values) => ({
    mutation: gql`
      mutation editCampaignTexters(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          texters {
            id
            firstName
            lastName
            assignment(campaignId: $campaignId) {
              contactsCount
              needsMessageCount: contactsCount(
                contactsFilter: { messageStatus: "needsMessage" }
              )
              maxContacts
            }
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
    title: "Texters",
    readinessName: "texters",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: true
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignTextersForm);
