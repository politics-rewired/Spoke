import PropTypes from "prop-types";
import React from "react";
import AssignmentTexter from "../components/AssignmentTexter";
import { withRouter } from "react-router";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";

const contactDataFragment = `
        id
        assignmentId
        firstName
        lastName
        cell
        zip
        customFields
        optOut {
          id
        }
        questionResponseValues {
          interactionStepId
          value
        }
        location {
          city
          state
        }
        timezone
        messageStatus
        messages {
          id
          createdAt
          text
          isFromContact
        }
        contactTags {
          id
          title
          description
          confirmationSteps
          isAssignable
          isSystem
          createdAt
        }
`;

class TexterTodo extends React.Component {
  componentWillMount() {
    const { assignment } = this.props.data;
    this.assignContactsIfNeeded();
    if (!assignment || assignment.campaign.isArchived) {
      const { organizationId } = this.props.match.params;
      this.props.history.push(`/app/${organizationId}/todos`);
    }
  }

  assignContactsIfNeeded = async (checkServer = false) => {
    const { assignment } = this.props.data;
    if (assignment.contacts.length === 0 || checkServer) {
      if (assignment.campaign.useDynamicAssignment) {
        const didAddContacts = (await this.props.mutations.findNewCampaignContact(
          assignment.id,
          1
        )).data.findNewCampaignContact.found;
        if (didAddContacts) {
          this.props.data.refetch();
          return;
        }
      }
      const { organizationId } = this.props.match.params;
      this.props.history.push(`/app/${organizationId}/todos`);
    }
  };

  loadContacts = async contactIds =>
    await this.props.mutations.getAssignmentContacts(contactIds);

  refreshData = () => {
    this.props.data.refetch();
  };

  render() {
    const { assignment } = this.props.data;
    const { organizationId } = this.props.match.params;
    const contactIds = assignment.contacts.map(contact => contact.id);
    const allContactsCount = assignment.allContactsCount;
    return (
      <AssignmentTexter
        assignment={assignment}
        contactIds={contactIds}
        allContactsCount={allContactsCount}
        assignContactsIfNeeded={this.assignContactsIfNeeded}
        refreshData={this.refreshData}
        loadContacts={this.loadContacts}
        onRefreshAssignmentContacts={this.refreshAssignmentContacts}
        organizationId={organizationId}
      />
    );
  }
}

TexterTodo.propTypes = {
  contactsFilter: PropTypes.string,
  messageStatus: PropTypes.string,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  data: PropTypes.object,
  mutations: PropTypes.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getContacts(
        $assignmentId: String!
        $contactsFilter: ContactsFilter!
      ) {
        assignment(id: $assignmentId) {
          id
          userCannedResponses {
            id
            title
            text
            isUserCreated
          }
          campaignCannedResponses {
            id
            title
            text
            isUserCreated
          }
          texter {
            id
            firstName
            lastName
            assignedCell
          }
          campaign {
            id
            title
            isArchived
            useDynamicAssignment
            timezone
            textingHoursStart
            textingHoursEnd
            organization {
              id
              threeClickEnabled
              optOutMessage
            }
            customFields
            interactionSteps {
              id
              scriptOptions
              question {
                text
                answerOptions {
                  value
                  nextInteractionStep {
                    id
                    scriptOptions
                  }
                }
              }
            }
          }
          contacts(contactsFilter: $contactsFilter) {
            id
          }
          allContactsCount: contactsCount
        }
      }
    `,
    variables: {
      contactsFilter: {
        messageStatus: ownProps.messageStatus,
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId: ownProps.match.params.assignmentId
    },
    forceFetch: true,
    pollInterval: 20000
  }
});

const mapMutationsToProps = ({ ownProps }) => ({
  findNewCampaignContact: (assignmentId, numberContacts = 1) => ({
    mutation: gql`
      mutation findNewCampaignContact(
        $assignmentId: String!
        $numberContacts: Int!
      ) {
        findNewCampaignContact(
          assignmentId: $assignmentId
          numberContacts: $numberContacts
        ) {
          found
        }
      }
    `,
    variables: {
      assignmentId,
      numberContacts
    }
  }),
  getAssignmentContacts: (contactIds, findNew) => ({
    mutation: gql`
      mutation getAssignmentContacts($assignmentId: String!, $contactIds: [String]!, $findNew: Boolean) {
        getAssignmentContacts(assignmentId: $assignmentId, contactIds: $contactIds, findNew: $findNew) {
          ${contactDataFragment}
        }
      }
    `,
    variables: {
      assignmentId: ownProps.match.params.assignmentId,
      contactIds,
      findNew: !!findNew
    }
  })
});

export default loadData(withRouter(TexterTodo), {
  mapQueriesToProps,
  mapMutationsToProps
});
