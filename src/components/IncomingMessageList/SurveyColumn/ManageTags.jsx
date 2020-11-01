import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";

import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import Dialog from "material-ui/Dialog";

import { loadData } from "../../../containers/hoc/with-operations";
import TagSelector from "../../TagSelector";

class ManageTags extends Component {
  state = {
    isTagEditorOpen: false,
    selectedTags: [],
    isWorking: false,
    error: undefined
  };

  componentWillReceiveProps(nextProps) {
    const { tags: oldTags } = this.props.contactTags.contact;
    const { tags: newTags } = nextProps.contactTags.contact;
    if (!isEqual(oldTags, newTags)) {
      this.state.selectedTags = [...newTags];
    }
  }

  handleOnClickEditTags = () =>
    this.setState({
      selectedTags: [...this.props.contactTags.contact.tags],
      isTagEditorOpen: true
    });

  handleCloseTagManager = () => this.setState({ isTagEditorOpen: false });

  handleOnChangeTags = (selectedTags) => this.setState({ selectedTags });

  handleSaveTags = async () => {
    const { tags } = this.props.contactTags.contact;
    const { selectedTags } = this.state;
    const contactTagIds = new Set(tags.map((tag) => tag.id));
    const selectedTagIds = new Set(selectedTags.map((tag) => tag.id));
    const addedTags = selectedTags.filter((tag) => !contactTagIds.has(tag.id));
    const removedTags = tags.filter((tag) => !selectedTagIds.has(tag.id));
    const tagPayload = {
      addedTagIds: addedTags.map((tag) => tag.id),
      removedTagIds: removedTags.map((tag) => tag.id)
    };

    this.setState({ isWorking: true });
    try {
      const response = await this.props.mutations.tagContact(tagPayload);
      if (response.errors) throw response.errors;
      this.handleCloseTagManager();
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleCloseErrorDialog = () => this.setState({ error: undefined });

  render() {
    const { tagList } = this.props.organizationTags.organization;
    const { tags: contactTags } = this.props.contactTags.contact;
    const { isTagEditorOpen, selectedTags, isWorking, error } = this.state;

    const actions = [
      <RaisedButton
        label="Save"
        primary={true}
        disabled={isWorking}
        onClick={this.handleSaveTags}
      />,
      <FlatButton label="Cancel" onClick={this.handleCloseTagManager} />
    ];

    const errorActions = [
      <RaisedButton
        label="OK"
        primary={true}
        disabled={isWorking}
        onClick={this.handleCloseErrorDialog}
      />
    ];

    return (
      <div style={{ textAlign: "right" }}>
        <RaisedButton
          label={`Edit Tags (${contactTags.length})`}
          disabled={isWorking}
          onClick={this.handleOnClickEditTags}
        />
        <Dialog
          title="Manage Tags"
          actions={actions}
          open={isTagEditorOpen}
          modal={false}
          onRequestClose={this.handleCloseTagManager}
        >
          <TagSelector
            dataSource={tagList}
            value={selectedTags}
            onChange={this.handleOnChangeTags}
          />
        </Dialog>
        <Dialog
          title="Error Updating Tags"
          actions={errorActions}
          open={error !== undefined}
          modal={false}
          onRequestClose={this.handleCloseErrorDialog}
        >
          {error}
        </Dialog>
      </div>
    );
  }
}

ManageTags.defaultProps = {};

ManageTags.propTypes = {
  organizationId: PropTypes.string.isRequired,
  organizationTags: PropTypes.object.isRequired,
  contactId: PropTypes.string.isRequired,
  contactTags: PropTypes.object.isRequired
};

const queries = {
  organizationTags: {
    query: gql`
      query getOrganizationTags($organizationId: String!) {
        organization(id: $organizationId) {
          id
          tagList {
            id
            title
            description
            confirmationSteps
            onApplyScript
            isSystem
            isAssignable
            createdAt
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      },
      fetchPolicy: "network-only"
    })
  },
  contactTags: {
    query: gql`
      query getContactTags($contactId: String!) {
        contact(id: $contactId) {
          id
          tags: contactTags {
            id
            title
            description
            confirmationSteps
            onApplyScript
            isSystem
            isAssignable
            createdAt
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        contactId: ownProps.contactId
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  tagContact: (ownProps) => (tagPayload) => ({
    mutation: gql`
      mutation tagConversation(
        $contactId: String!
        $tagPayload: ContactTagActionInput!
      ) {
        tagConversation(campaignContactId: $contactId, tag: $tagPayload) {
          id
          assignmentId
        }
      }
    `,
    variables: {
      contactId: ownProps.contactId,
      tagPayload
    },
    refetchQueries: ["getContactTags"]
  })
};

export default loadData({
  queries,
  mutations
})(ManageTags);
