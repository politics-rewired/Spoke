import React, { Component } from "react";
import PropTypes from "prop-types";

import ReactMarkdown from "react-markdown";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import Dialog from "material-ui/Dialog";
import ChipInput from "material-ui-chip-input";

const ApplyTagStep = Object.freeze({ None: 0, TagSelect: 1 });

class ApplyTagButton extends Component {
  state = {
    applyStepIndex: ApplyTagStep.None,
    selectedTags: [],
    pendingTag: undefined,
    confirmStepIndex: -1
  };

  componentDidMount() {
    this.setState({ selectedTags: this.props.contactTags.slice() });
  }

  addTag = tag => {
    const { selectedTags } = this.state;
    selectedTags.push(tag);
    this.setState({ selectedTags });
  };

  handleOpenTagSelectionDialog = () =>
    this.setState({ applyStepIndex: ApplyTagStep.TagSelect });

  handleCloseTagSelectionDialog = () =>
    this.setState({ applyStepIndex: ApplyTagStep.None });

  // Prevent user-defined tags
  handleBeforeRequestAdd = ({ id: tagId, title }) =>
    !isNaN(tagId) && tagId !== title;

  handleAddTag = ({ id: tagId }) => {
    const { allTags } = this.props;
    const tag = allTags.find(tag => tag.id === tagId);

    if (tag.confirmationSteps.length > 0) {
      return this.setState({ pendingTag: tag, confirmStepIndex: 0 });
    }

    this.addTag(tag);
  };

  handleRemoveTag = deleteTag => {
    const selectedTags = this.state.selectedTags.filter(
      tag => tag.id !== deleteTag.id
    );
    this.setState({ selectedTags });
  };

  handleCloseConfirm = () => this.setState({ pendingTag: undefined });

  handleConfirmStep = () => {
    const { pendingTag, confirmStepIndex } = this.state;
    const { confirmationSteps } = pendingTag;

    if (confirmStepIndex < confirmationSteps.length - 1)
      return this.setState({ confirmStepIndex: confirmStepIndex + 1 });

    this.addTag(pendingTag);
    this.handleCloseConfirm();
  };

  handleApplyTags = () => {
    const { contactTags } = this.props;
    const { selectedTags } = this.state;
    const contactTagIds = new Set(contactTags.map(tag => tag.id));
    const selectedTagIds = new Set(selectedTags.map(tag => tag.id));
    const addedTags = selectedTags.filter(tag => !contactTagIds.has(tag.id));
    const removedTags = contactTags.filter(tag => !selectedTagIds.has(tag.id));

    this.props.onApplyTag(addedTags, removedTags);
    this.handleCloseConfirm();
    this.handleCloseTagSelectionDialog();
  };

  render() {
    const { allTags } = this.props;
    const {
      applyStepIndex,
      selectedTags,
      pendingTag,
      confirmStepIndex
    } = this.state;

    const selectTagActions = [
      <FlatButton label="Save" primary onClick={this.handleApplyTags} />,
      <FlatButton
        label="Cancel"
        primary
        onClick={this.handleCloseTagSelectionDialog}
      />
    ];

    const confirmationStep = ((pendingTag || {}).confirmationSteps || [])[
      confirmStepIndex
    ] || ["", "", ""];
    const [content, confirm, cancel] = confirmationStep;
    const confrimTagActions = [
      <FlatButton label={confirm} primary onClick={this.handleConfirmStep} />,
      <FlatButton label={cancel} primary onClick={this.handleCloseConfirm} />
    ];

    return (
      <div>
        <RaisedButton
          label="Tag"
          disabled={allTags.length === 0}
          onClick={this.handleOpenTagSelectionDialog}
        />
        <Dialog
          title="Manage Tags"
          open={applyStepIndex > 0}
          actions={selectTagActions}
          onRequestClose={this.handleCloseTagSelectionDialog}
        >
          <p>Select tags:</p>
          <ChipInput
            value={selectedTags}
            dataSourceConfig={{ text: "title", value: "id" }}
            dataSource={allTags}
            fullWidth={true}
            onBeforeRequestAdd={this.handleBeforeRequestAdd}
            onRequestAdd={this.handleAddTag}
            onRequestDelete={this.handleRemoveTag}
          />
        </Dialog>
        <Dialog
          title={"Confirm Add Tag"}
          open={pendingTag !== undefined}
          actions={confrimTagActions}
          onRequestClose={this.handleCloseConfirm}
        >
          <ReactMarkdown source={content} />
        </Dialog>
      </div>
    );
  }
}

ApplyTagButton.propTypes = {
  contactTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  allTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  onApplyTag: PropTypes.func.isRequired
};

export default ApplyTagButton;
