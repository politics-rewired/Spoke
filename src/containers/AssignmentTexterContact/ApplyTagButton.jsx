import React, { Component } from "react";
import PropTypes from "prop-types";

import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import MoreIcon from "material-ui/svg-icons/navigation/more-vert";
import Dialog from "material-ui/Dialog";

import TagSelector from "../../components/TagSelector";
import ApplyTagConfirmationDialog from "../../components/ApplyTagConfirmationDialog";

const isEscalateTag = t => t.title === "Escalated" || t.title === "Escalate";
const isNonAssignableTagApplied = appliedTags =>
  appliedTags.findIndex(t => !t.isAssignable) > -1;

const ApplyTagStep = Object.freeze({ None: 0, TagSelect: 1 });

class ApplyTagButton extends Component {
  state = {
    applyStepIndex: ApplyTagStep.None,
    selectedTags: [],
    pendingTag: undefined
  };

  componentWillMount() {
    this.state.selectedTags = this.props.pendingNewTags;
  }

  resetTags = () =>
    this.setState({ selectedTags: this.props.contactTags.slice() });

  handleOnTagChange = selectedTags => this.setState({ selectedTags });

  handleAddEscalatedTag = () => {
    const { allTags } = this.props;
    const escalateTag = allTags.find(isEscalateTag);
    this.setState({ pendingTag: escalateTag });
  };

  handleOnCancelEscalateTag = () => this.setState({ pendingTag: undefined });

  handleOnConfirmAddEscalatedTag = escalateTag => {
    const selectedTags = [...this.state.selectedTags];
    if (selectedTags.findIndex(tag => tag.id === escalateTag.id) === -1) {
      selectedTags.push(escalateTag);
      this.setState({ selectedTags });
    }
    this.handleOnCancelEscalateTag();
  };

  handleOpenTagSelectionDialog = () => {
    this.resetTags();
    this.setState({ applyStepIndex: ApplyTagStep.TagSelect });
  };

  handleCloseTagSelectionDialog = () =>
    this.setState({ applyStepIndex: ApplyTagStep.None });

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

  handleApplyTagsAndMoveOn = () => {
    const { contactTags } = this.props;
    const { selectedTags } = this.state;
    const contactTagIds = new Set(contactTags.map(tag => tag.id));
    const selectedTagIds = new Set(selectedTags.map(tag => tag.id));
    const addedTags = selectedTags.filter(tag => !contactTagIds.has(tag.id));
    const removedTags = contactTags.filter(tag => !selectedTagIds.has(tag.id));

    this.props.onApplyTagsAndMoveOn(addedTags, removedTags);
    this.handleCloseConfirm();
    this.handleCloseTagSelectionDialog();
  };

  render() {
    const { allTags } = this.props;
    const { applyStepIndex, selectedTags, pendingTag } = this.state;

    const escalateTag = allTags.find(isEscalateTag);
    const tagsWithoutEscalated = allTags.filter(t => !isEscalateTag(t));

    const shouldAllowUserToMoveOn = isNonAssignableTagApplied(selectedTags);

    const saveActions = shouldAllowUserToMoveOn
      ? [
          <FlatButton
            label="Save and Type Message"
            primary
            onClick={this.handleApplyTags}
          />,
          <FlatButton
            label="Save and Move On Without a Message"
            primary
            onClick={this.handleApplyTagsAndMoveOn}
          />
        ]
      : [<FlatButton label="Save" primary onClick={this.handleApplyTags} />];

    const selectTagActions = saveActions.concat([
      <FlatButton
        label="Cancel"
        primary
        onClick={this.handleCloseTagSelectionDialog}
      />
    ]);

    return (
      <div>
        <RaisedButton
          label="More"
          disabled={allTags.length === 0}
          onClick={this.handleOpenTagSelectionDialog}
          labelPosition="before"
          icon={<MoreIcon />}
        />
        <Dialog
          title="More Actions"
          open={applyStepIndex > 0}
          actions={selectTagActions}
          onRequestClose={this.handleCloseTagSelectionDialog}
        >
          {!!escalateTag && (
            <RaisedButton
              buttonStyle={{ paddingLeft: 20, paddingRight: 20 }}
              secondary={true}
              onClick={this.handleAddEscalatedTag}
            >
              Escalate Conversation
            </RaisedButton>
          )}
          <TagSelector
            value={selectedTags}
            dataSource={tagsWithoutEscalated}
            onChange={this.handleOnTagChange}
          />
        </Dialog>
        <ApplyTagConfirmationDialog
          pendingTag={pendingTag}
          onCancel={this.handleOnCancelEscalateTag}
          onConfirm={this.handleOnConfirmAddEscalatedTag}
        />
      </div>
    );
  }
}

ApplyTagButton.propTypes = {
  contactTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  allTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  pendingNewTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  onApplyTag: PropTypes.func.isRequired
};

export default ApplyTagButton;
