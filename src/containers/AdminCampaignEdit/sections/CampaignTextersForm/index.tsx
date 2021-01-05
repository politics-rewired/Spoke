import { css, StyleSheet } from "aphrodite";
import { ApolloQueryResult } from "apollo-client/core/types";
import gql from "graphql-tag";
import orderBy from "lodash/orderBy";
import uniqBy from "lodash/uniqBy";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import { red600 } from "material-ui/styles/colors";
import moment from "moment";
import React from "react";
import { compose } from "recompose";
import * as yup from "yup";

import GSForm from "../../../../components/forms/GSForm";
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
import {
  handleAutoSplit,
  handleExtraTexterCapacity,
  mapFormTexters
} from "./utils";

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
  data: {
    campaign: {
      id: string;
      texters: Texter[];
      isStarted: boolean;
      dueBy: string;
      contactsCount: number;
    };
  };
}

interface State {
  autoSplit: boolean;
  focusedTexterId: string | null;
  textersToAdd: Texter[];
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
  ensureComplete: boolean;
}

interface FormValues {
  texters: Texter[];
}

interface TexterAssignment {
  contactsCount: number;
  needsMessageCount: number;
  maxContacts: number;
}

export interface Texter {
  id: string;
  firstName: string;
  assignment: TexterAssignment;
}

interface Values {
  texters: any[];
}

class CampaignTextersForm extends React.Component<InnerProps, State> {
  state = {
    autoSplit: false,
    focusedTexterId: null,
    textersToAdd: [],
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
    const { textersToAdd: editedTexters, textersToRemoveIds } = this.state;
    const { texters } = this.props.data.campaign;
    const deletedTexterIds: string[] = textersToRemoveIds;
    const editedTexterIds = editedTexters.map((t: Texter) => t.id);
    const unorderedTexters = texters
      .filter((texter) => !editedTexterIds.includes(texter.id))
      .concat(editedTexters)
      .filter((texter: Texter) => !deletedTexterIds.includes(texter.id));

    const orderedTexters = orderBy(
      unorderedTexters,
      ["firstName", "lastName"],
      ["asc", "asc"]
    );
    return {
      texters: orderedTexters
    };
  };

  onChange = (formValues: FormValues) => {
    const { focusedTexterId } = this.state;
    const { contactsCount } = this.props.data.campaign;
    const { texters: textersToAdd } = formValues;
    const focusedTexter = textersToAdd.find((t) => t.id === focusedTexterId);
    const formattedTexters = textersToAdd.map((t) => ({
      assignment: {
        contactsCount: t.assignment.contactsCount,
        needsMessageCount: t.assignment.needsMessageCount,
        maxContacts: contactsCount
      },
      firstName: t.firstName,
      id: t.id
    }));

    console.log("on changed formatted texters", formattedTexters);

    this.setState({ textersToAdd: formattedTexters });

    // old
    // const existingFormValues = this.collectFormValues();
    // const changedTexterId = this.state.focusedTexterId;
    // const newFormValues = {
    //   ...formValues
    // };
    // let totalNeedsMessage = 0;
    // let totalMessaged = 0;
    // const texterCountChanged =
    //   newFormValues.texters.length !== existingFormValues.texters.length;

    // // 1. map form texters to existing texters. with needsMessageCount tweaked to minimums when invalid or useless

    // moved to mapFormTexters
    mapFormTexters();

    // // extraTexterCapacity is the number of contacts assigned to texters in excess of the
    // // total number of contacts available
    const extraTexterCapacity = 0;
    // totalNeedsMessage + totalMessaged - contactsCount;

    if (extraTexterCapacity > 0) {
      // moved to handleExtraTexter capacity
      handleExtraTexterCapacity();
    } else if (this.state.autoSplit) {
      handleAutoSplit(
        newFormValues,
        extraTexterCapacity,
        changedTexterId,
        contactsCount
      );
    }

    // setState should happen here
    // this.props.onChange(newFormValues);
  };

  addTexter = (newTexter: Texter) => {
    const { textersToAdd, textersToRemoveIds } = this.state;
    let newIds: string[] = [];
    if (textersToRemoveIds.includes(newTexter.id)) {
      newIds = textersToRemoveIds.filter((id) => id !== newTexter.id);
    }
    const prevTexters = textersToAdd.filter(
      (t: Texter) => t.id !== newTexter.id
    );
    const newTexters = [newTexter, ...prevTexters];
    this.setState({
      textersToAdd: newTexters,
      searchText: "",
      textersToRemoveIds: newIds
    });
  };

  addAllTexters = () => {
    const { orgTexters } = this.props;

    const textersToAdd = orgTexters.map((orgTexter) => {
      const { id, firstName } = orgTexter;
      return {
        id,
        firstName,
        assignment: {
          contactsCount: 0,
          needsMessageCount: 0,
          maxContacts: 0
        }
      };
    });

    this.setState({ textersToAdd });
  };

  // see note below for dynamic assignments
  // handleDynamicAssignmentToggle = (_ev, toggled) =>
  //   this.props.onChange({ useDynamicAssignment: toggled });

  handleSearchTexters = (searchText: string) => {
    this.setState({ searchText });
  };

  handleAssignContacts = (numberOfContacts: string) => {
    const { focusedTexterId } = this.state;
    const { texters } = this.collectFormValues();
    const focusedTexter: Texter = texters.find(
      (t: Texter) => t.id === focusedTexterId
    );
    const needsMessageCount = parseInt(numberOfContacts, 10);
    const texterWithContacts: Texter = {
      ...focusedTexter,
      assignment: { ...focusedTexter.assignment, needsMessageCount }
    };

    const newTexters = uniqBy(
      [texterWithContacts, ...texters],
      (texter) => texter.id
    );
    this.setState({
      textersToAdd: newTexters
    });
  };

  handleFocusTexterId = (focusedTexterId: string | null) => {
    this.setState({ focusedTexterId });
  };

  handleRemoveTexter = (texterId: string) => {
    const { textersToRemoveIds } = this.state;
    const newIds = [...textersToRemoveIds, texterId];
    this.setState({ textersToRemoveIds: newIds });
  };

  removeEmptyTexters = () => {
    const { texters } = this.collectFormValues();
    const newTexters = texters.filter(
      (t: Texter) =>
        t.assignment.contactsCount !== 0 || t.assignment.needsMessageCount !== 0
    );
    this.setState({ textersToAdd: newTexters });
  };

  handleSubmit = async () => {
    const { editCampaign } = this.props.mutations;
    const { texters } = this.collectFormValues();
    const texterInput = texters.map((t: Texter) => ({
      id: t.id,
      needsMessageCount: t.assignment.needsMessageCount,
      maxContacts: t.assignment.maxContacts,
      contactsCount: t.assignment.contactsCount
    }));

    this.setState({ isWorking: true });
    try {
      const response = await editCampaign({ texters: texterInput });
      if (response.errors) throw response.errors;
      this.setState({
        textersToAdd: []
      });
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleSplitAssignmentsToggle = (_ev: any, toggled: boolean) =>
    this.setState({ autoSplit: toggled }, () => {
      if (!this.state.autoSplit) return;

      const { texters } = this.collectFormValues();
      let { contactsCount } = this.props.data.campaign;
      if (!contactsCount) return;
      contactsCount = Math.floor(contactsCount / texters.length);
      const newTexters = texters.map((texter: Texter) => ({
        ...texter,
        assignment: {
          ...texter.assignment,
          contactsCount
        }
      }));
      this.setState({ textersToAdd: newTexters });
    });

  handleSnackbarClose = () =>
    this.setState({ snackbarOpen: false, snackbarMessage: "" });

  render() {
    const { saveLabel, saveDisabled, orgTexters, data } = this.props;
    const {
      searchText,
      autoSplit,
      snackbarOpen,
      snackbarMessage,
      isWorking
    } = this.state;
    const { contactsCount } = data.campaign;
    const availableTexters = this.collectFormValues().texters;
    const assignedContacts = availableTexters.reduce(
      (prev: number, texter: Texter) => prev + texter.assignment.contactsCount,
      0
    );

    const shouldShowTextersManager = orgTexters.length > 0;
    const isOverdue = moment().isSameOrAfter(this.props.data.campaign.dueBy);
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;
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
        {/* TODO: re-enable once dynamic assignment is fixed (#548) */}
        {/* <div>
          <Toggle
            {...dataTest("useDynamicAssignment")}
            label="Dynamically assign contacts"
            toggled={this.collectFormValues().useDynamicAssignment}
            onToggle={this.handleDynamicAssignmentToggle}
          />
          {this.collectFormValues().useDynamicAssignment && (
            <OrganizationJoinLink
              organizationUuid={organizationUuid}
              campaignId={campaignId}
            />
          )}
        </div> */}
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
              handleFocusTexterId={this.handleFocusTexterId}
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
  data: {
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
          isStarted
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
