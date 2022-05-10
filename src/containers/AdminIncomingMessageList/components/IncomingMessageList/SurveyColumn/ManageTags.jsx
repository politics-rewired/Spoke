import { gql } from "@apollo/client";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import isEqual from "lodash/isEqual";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import React, { Component } from "react";

import TagSelector from "../../../../../components/TagSelector";
import { loadData } from "../../../../hoc/with-operations";

class ManageTags extends Component {
  state = {
    isTagEditorOpen: false,
    selectedTags: [],
    isWorking: false,
    error: undefined
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { tags: oldTags } = this.props.contactTags.contact;
    const { tags: newTags } = nextProps.contactTags.contact;
    if (!isEqual(oldTags, newTags)) {
      // eslint-disable-next-line react/no-direct-mutation-state
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
        key="save"
        label="Save"
        primary
        disabled={isWorking}
        onClick={this.handleSaveTags}
      />,
      <FlatButton
        key="cancel"
        label="Cancel"
        onClick={this.handleCloseTagManager}
      />
    ];

    const errorActions = [
      <RaisedButton
        key="ok"
        label="OK"
        primary
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
        <Dialog open={isTagEditorOpen} onClose={this.handleCloseTagManager}>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogContent>
            <TagSelector
              dataSource={tagList}
              value={selectedTags}
              onChange={this.handleOnChangeTags}
            />
          </DialogContent>
          <DialogActions>{actions}</DialogActions>
        </Dialog>
        <Dialog
          open={error !== undefined}
          onClose={this.handleCloseErrorDialog}
        >
          <DialogTitle>Error Updating Tags</DialogTitle>
          <DialogContent>
            <DialogContentText>{error}</DialogContentText>
          </DialogContent>
          <DialogActions>{errorActions}</DialogActions>
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
            textColor
            backgroundColor
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
