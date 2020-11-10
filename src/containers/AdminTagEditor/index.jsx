import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import pick from "lodash/pick";

import FloatingActionButton from "material-ui/FloatingActionButton";
import Dialog from "material-ui/Dialog";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import FlatButton from "material-ui/FlatButton";
import ContentAddIcon from "material-ui/svg-icons/content/add";
import ColorPicker from "material-ui-color-picker";

import { formatErrorMessage, withOperations } from "../hoc/with-operations";
import LoadingIndicator from "../../components/LoadingIndicator";
import TagEditorList from "./TagEditorList";
import theme from "../../styles/theme";
import ConfirmationStepsEditor from "./ConfirmationStepsEditor";
import GSScriptField from "../../components/forms/GSScriptField";

class AdminTagEditor extends Component {
  state = {
    editingTag: undefined,
    isWorking: false,
    isEditingSteps: false,
    error: undefined
  };

  getTag = tagId => {
    const { tagList = [] } = this.props.organizationTags.organization || {};
    return Object.assign({}, tagList.find(tag => tag.id === tagId));
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

  handleEditTag = tagId => this.setState({ editingTag: this.getTag(tagId) });

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

  handleDeleteTag = async tagId => {
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

  handleEditTagScript = script => {
    this.setState({
      editingTag: { ...this.state.editingTag, onApplyScript: script },
      isEditingScript: false
    });
  };

  handleEditTextColor = color => {
    this.setState({
      editingTag: { ...this.state.editingTag, textColor: color }
    });
  };

  handleEditBackgroundColor = color => {
    this.setState({
      editingTag: { ...this.state.editingTag, backgroundColor: color }
    });
  };

  handleEditWebhookUrl = url => {
    this.setState({
      editingTag: { ...this.state.editingTag, webhookUrl: url }
    });
  };

  handleToggleStepsEditorOpen = () => {
    this.setState({ isEditingSteps: !this.state.isEditingSteps });
  };

  handleSaveConfirmationStep = newStep => {
    const { editingTag } = this.state;
    const newConfirmationSteps = [...editingTag.confirmationSteps, newStep];
    this.setState({
      editingTag: {
        ...this.state.editingTag,
        confirmationSteps: newConfirmationSteps
      }
    });
  };

  handleDeleteConfirmationStep = stepIndex => {
    const { editingTag } = this.state;
    let newConfirmationSteps = [...editingTag.confirmationSteps];
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
      <FlatButton label="Cancel" onClick={this.handleCancelEditTag} />,
      <FlatButton label={tagVerb} primary={true} onClick={this.handleSaveTag} />
    ];

    // Custom fields are campaign-specific and thus cannot be used in Tag scripts.
    // However, this is a required prop for GSScriptField
    const customFields = [""];

    const errorActions = [
      <FlatButton label="Ok" primary={true} onClick={this.handleCancelError} />
    ];

    return (
      <div>
        <TagEditorList
          tags={tagList}
          oEditTag={this.handleEditTag}
          onDeleteTag={this.handleDeleteTag}
        />
        <FloatingActionButton
          style={theme.components.floatingButton}
          disabled={isWorking}
          onClick={this.handleClickAddTag}
        >
          <ContentAddIcon />
        </FloatingActionButton>
        {editingTag && (
          <div>
            <Dialog
              title={`${tagVerb} Tag`}
              actions={actions}
              modal={false}
              open={true}
              onRequestClose={this.handleCancelEditTag}
            >
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
                    multiLine={true}
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
              <div style={{ display: 'flex', alignItems: 'center'}}>
                <span>Tag confirmation steps: {editingTag.confirmationSteps.length}</span>
                <FlatButton
                  label="Manage steps"
                  onClick={this.handleToggleStepsEditorOpen}
                  primary
                  style={{ marginLeft: 8 }}
                />
              </div>
              <TextField
                name="webhookUrl"
                floatingLabelText="Webhook url"
                hintText="If set, a request will be sent to this URL whenever this tag is applied."
                value={editingTag.webhookUrl || ""}
                onChange={this.createTagEditorHandle}
                fullWidth
              />
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
        <Dialog
          title="Error"
          actions={errorActions}
          open={error !== undefined}
          onRequestClose={this.handleCancelError}
        >
          {error || ""}
        </Dialog>
      </div>
    );
  }
}

AdminTagEditor.defaultProps = {};

AdminTagEditor.propTypes = {
  match: PropTypes.object.isRequired
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
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations = {
  saveTag: ownProps => tag => ({
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
  deleteTag: ownProps => tagId => ({
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
