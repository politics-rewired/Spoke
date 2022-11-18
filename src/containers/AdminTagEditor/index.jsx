import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import pick from "lodash/pick";
import ColorPicker from "material-ui-color-picker";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import PropTypes from "prop-types";
import React, { Component } from "react";

import GSScriptField from "../../components/forms/GSScriptField";
import LoadingIndicator from "../../components/LoadingIndicator";
import theme from "../../styles/theme";
import {
  formatErrorMessage,
  PrettyErrors,
  withOperations
} from "../hoc/with-operations";
import ConfirmationStepsEditor from "./components/ConfirmationStepsEditor";
import TagEditorList from "./components/TagEditorList";

class AdminTagEditor extends Component {
  state = {
    editingTag: undefined,
    isWorking: false,
    isEditingSteps: false,
    error: undefined
  };

  getTag = (tagId) => {
    const { tagList = [] } = this.props.organizationTags.organization || {};
    return {
      ...tagList.find((tag) => tag.id === tagId)
    };
  };

  handleCancelError = () => this.setState({ error: undefined });

  handleClickAddTag = () =>
    this.setState({
      editingTag: {
        title: "",
        description: "",
        textColor: "",
        backgroundColor: "",
        confirmationSteps: [],
        onApplyScript: "",
        webhookUrl: "",
        isAssignable: true
      }
    });

  handleEditTag = (tagId) => this.setState({ editingTag: this.getTag(tagId) });

  handleCancelEditTag = () =>
    this.setState({ editingTag: undefined, isEditingScript: false });

  handleSaveTag = async () => {
    const { editingTag } = this.state;
    const tag = pick(editingTag, [
      "id",
      "title",
      "description",
      "textColor",
      "backgroundColor",
      "confirmationSteps",
      "onApplyScript",
      "webhookUrl",
      "isAssignable"
    ]);
    this.setState({ isWorking: true });
    try {
      const result = await this.props.mutations.saveTag(tag);
      if (result.errors) throw new Error(result.errors);
    } catch (error) {
      this.setState({ error: formatErrorMessage(error.message) });
    } finally {
      this.setState({ isWorking: false });
      this.handleCancelEditTag();
    }
  };

  handleDeleteTag = async (tagId) => {
    this.setState({ isWorking: true });
    try {
      const result = await this.props.mutations.deleteTag(tagId);
      if (result.errors) throw new Error(result.errors);
    } catch (error) {
      this.setState({ error: formatErrorMessage(error.message) });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  createTagEditorHandle = (event, value) => {
    let { editingTag } = this.state;
    editingTag = Object.assign(editingTag, { [event.target.name]: value });
    this.setState({ editingTag });
  };

  handleOpenScriptEditor = () => {
    this.setState({ isEditingScript: !this.state.isEditingScript });
  };

  handleEditTagScript = (script) => {
    this.setState({
      editingTag: { ...this.state.editingTag, onApplyScript: script },
      isEditingScript: false
    });
  };

  handleEditTextColor = (color) => {
    this.setState({
      editingTag: { ...this.state.editingTag, textColor: color }
    });
  };

  handleEditBackgroundColor = (color) => {
    this.setState({
      editingTag: { ...this.state.editingTag, backgroundColor: color }
    });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  handleEditWebhookUrl = (url) => {
    this.setState({
      editingTag: { ...this.state.editingTag, webhookUrl: url }
    });
  };

  handleToggleStepsEditorOpen = () => {
    this.setState({ isEditingSteps: !this.state.isEditingSteps });
  };

  handleSaveConfirmationStep = (newStep) => {
    const { editingTag } = this.state;
    const newConfirmationSteps = [...editingTag.confirmationSteps, newStep];
    this.setState({
      editingTag: {
        ...this.state.editingTag,
        confirmationSteps: newConfirmationSteps
      }
    });
  };

  handleDeleteConfirmationStep = (stepIndex) => {
    const { editingTag } = this.state;
    const newConfirmationSteps = [...editingTag.confirmationSteps];
    newConfirmationSteps.splice(stepIndex, 1);
    this.setState({
      editingTag: {
        ...this.state.editingTag,
        confirmationSteps: newConfirmationSteps
      }
    });
  };

  render() {
    const { organizationTags } = this.props;
    const { editingTag, isWorking, error, isEditingSteps } = this.state;

    if (organizationTags.loading) return <LoadingIndicator />;
    if (organizationTags.errors) {
      return <PrettyErrors errors={organizationTags.errors} />;
    }

    const { tagList } = organizationTags.organization;

    const isNewTag = (editingTag || {}).id === undefined;
    const tagVerb = isNewTag ? "Create" : "Edit";
    const actions = [
      <Button key="cancel" onClick={this.handleCancelEditTag}>
        Cancel
      </Button>,
      <Button key="verb" color="primary" onClick={this.handleSaveTag}>
        {tagVerb}
      </Button>
    ];

    // Custom fields are campaign-specific and thus cannot be used in Tag scripts.
    // However, this is a required prop for GSScriptField
    const customFields = [];
    const campaignVariables = [];
    const integrationSourced = false;

    const errorActions = [
      <Button key="ok" color="primary" onClick={this.handleCancelError}>
        Ok
      </Button>
    ];

    return (
      <div>
        <TagEditorList
          tags={tagList}
          oEditTag={this.handleEditTag}
          onDeleteTag={this.handleDeleteTag}
        />
        <Fab
          color="primary"
          style={theme.components.floatingButton}
          disabled={isWorking}
          onClick={this.handleClickAddTag}
        >
          <AddIcon />
        </Fab>
        {editingTag && (
          <div>
            <Dialog open onClose={this.handleCancelEditTag}>
              <DialogTitle>{`${tagVerb} Tag`}</DialogTitle>
              <DialogContent>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <TextField
                      name="title"
                      floatingLabelText="Tag title"
                      value={editingTag.title || ""}
                      onChange={this.createTagEditorHandle}
                    />
                    <GSScriptField
                      name="Script"
                      label="Tag script"
                      context="tagEditor"
                      customFields={customFields}
                      campaignVariables={campaignVariables}
                      integrationSourced={integrationSourced}
                      value={editingTag.onApplyScript || ""}
                      onChange={this.handleEditTagScript}
                      onClick={this.handleOpenScriptEditor}
                    />
                    <br />
                    <Toggle
                      name="isAssignable"
                      label="Allow assignment?"
                      toggled={editingTag.isAssignable}
                      onToggle={this.createTagEditorHandle}
                    />
                  </div>
                  <div>
                    <TextField
                      name="description"
                      floatingLabelText="Tag description"
                      multiLine
                      value={editingTag.description || ""}
                      onChange={this.createTagEditorHandle}
                    />
                    <ColorPicker
                      name="Text Color"
                      floatingLabelText="Text color"
                      defaultValue={editingTag.textColor}
                      value={editingTag.textColor || ""}
                      onChange={this.handleEditTextColor}
                    />
                    <ColorPicker
                      name="Background Color"
                      floatingLabelText="Background color"
                      defaultValue={editingTag.backgroundColor}
                      value={editingTag.backgroundColor || ""}
                      onChange={this.handleEditBackgroundColor}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span>
                    Tag confirmation steps:{" "}
                    {editingTag.confirmationSteps.length}
                  </span>
                  <Button
                    onClick={this.handleToggleStepsEditorOpen}
                    color="primary"
                    style={{ marginLeft: 8 }}
                  >
                    Manage steps
                  </Button>
                </div>
                <TextField
                  name="webhookUrl"
                  floatingLabelText="Webhook url"
                  hintText="If set, a request will be sent to this URL whenever this tag is applied."
                  value={editingTag.webhookUrl || ""}
                  onChange={this.createTagEditorHandle}
                  fullWidth
                />
              </DialogContent>
              <DialogActions>{actions}</DialogActions>
            </Dialog>
            <ConfirmationStepsEditor
              confirmationSteps={editingTag.confirmationSteps}
              handleSaveStep={this.handleSaveConfirmationStep}
              handleDeleteStep={this.handleDeleteConfirmationStep}
              handleToggleStepsEditorOpen={this.handleToggleStepsEditorOpen}
              open={isEditingSteps}
            />
          </div>
        )}
        <Dialog open={error !== undefined} onClose={this.handleCancelError}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            <DialogContentText>{error || ""}</DialogContentText>
          </DialogContent>
          <DialogActions>{errorActions}</DialogActions>
        </Dialog>
      </div>
    );
  }
}

AdminTagEditor.defaultProps = {};

AdminTagEditor.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      organizationId: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
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
            isSystem
            isAssignable
            onApplyScript
            textColor
            backgroundColor
            webhookUrl
            confirmationSteps
            createdAt
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

const mutations = {
  saveTag: (ownProps) => (tag) => ({
    mutation: gql`
      mutation saveTag($organizationId: String!, $tag: TagInput!) {
        saveTag(organizationId: $organizationId, tag: $tag) {
          id
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      tag
    },
    refetchQueries: ["getOrganizationTags"]
  }),
  deleteTag: (ownProps) => (tagId) => ({
    mutation: gql`
      mutation deleteTag($organizationId: String!, $tagId: String!) {
        deleteTag(organizationId: $organizationId, tagId: $tagId)
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      tagId
    },
    refetchQueries: ["getOrganizationTags"]
  })
};

export default withOperations({
  queries,
  mutations
})(AdminTagEditor);
