import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import React, { Component } from "react";

import ApplyTagConfirmationDialog from "../../components/ApplyTagConfirmationDialog";
import TagSelector from "../../components/TagSelector";

const isEscalateTag = (t) => t.title === "Escalated" || t.title === "Escalate";
const isNonAssignableTagApplied = (appliedTags) =>
  appliedTags.findIndex((t) => !t.isAssignable) > -1;

class ApplyTagDialog extends Component {
  state = {
    selectedTags: [],
    pendingTag: undefined
  };

  componentWillMount() {
    this.state.selectedTags = this.props.pendingNewTags;
  }

  componentWillReceiveProps(nextProps) {
    if (!!nextProps.open && !this.props.open) {
      this.resetTags();
    }
  }

  resetTags = () =>
    this.setState({ selectedTags: this.props.contactTags.slice() });

  handleOnTagChange = (selectedTags) => this.setState({ selectedTags });

  handleAddEscalatedTag = () => {
    const { allTags } = this.props;
    const escalateTag = allTags.find(isEscalateTag);

    if (
      escalateTag.confirmationSteps &&
      escalateTag.confirmationSteps.length > 0
    ) {
      this.setState({ pendingTag: escalateTag });
    } else {
      this.handleOnConfirmAddEscalatedTag(escalateTag);
    }
  };

  handleOnCancelEscalateTag = () => this.setState({ pendingTag: undefined });

  handleOnConfirmAddEscalatedTag = (escalateTag) => {
    const selectedTags = [...this.state.selectedTags];
    if (selectedTags.findIndex((tag) => tag.id === escalateTag.id) === -1) {
      selectedTags.push(escalateTag);
      this.setState({ selectedTags });
    }
    this.handleOnCancelEscalateTag();
  };

  handleApplyTags = () => {
    const { contactTags } = this.props;
    const { selectedTags } = this.state;
    const contactTagIds = new Set(contactTags.map((tag) => tag.id));
    const selectedTagIds = new Set(selectedTags.map((tag) => tag.id));
    const addedTags = selectedTags.filter((tag) => !contactTagIds.has(tag.id));
    const removedTags = contactTags.filter(
      (tag) => !selectedTagIds.has(tag.id)
    );

    this.props.onApplyTag(addedTags, removedTags);
    this.handleOnCancelEscalateTag();
  };

  handleApplyTagsAndMoveOn = () => {
    const { contactTags } = this.props;
    const { selectedTags } = this.state;
    const contactTagIds = new Set(contactTags.map((tag) => tag.id));
    const selectedTagIds = new Set(selectedTags.map((tag) => tag.id));
    const addedTags = selectedTags.filter((tag) => !contactTagIds.has(tag.id));
    const removedTags = contactTags.filter(
      (tag) => !selectedTagIds.has(tag.id)
    );

    this.props.onApplyTagsAndMoveOn(addedTags, removedTags);
    this.handleOnCancelEscalateTag();
  };

  render() {
    const { open, allTags } = this.props;
    const { selectedTags, pendingTag } = this.state;

    const escalateTag = allTags.find(isEscalateTag);
    const tagsWithoutEscalated = allTags.filter((t) => !isEscalateTag(t));

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
      <FlatButton label="Cancel" primary onClick={this.props.onRequestClose} />
    ]);

    return (
      <div id="applyTagDialog">
        <Dialog
          title="More Actions"
          open={open}
          actions={selectTagActions}
          contentStyle={{ width: "100%", maxWidth: "none" }}
          onRequestClose={this.props.onRequestClose}
        >
          {!!escalateTag && (
            <RaisedButton
              buttonStyle={{ paddingLeft: 20, paddingRight: 20 }}
              secondary
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

ApplyTagDialog.defaultProps = {
  open: false,
  onRequestClose: () => {},
  onApplyTag: () => {},
  onApplyTagsAndMoveOn: () => {}
};

ApplyTagDialog.propTypes = {
  open: PropTypes.bool,
  contactTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  allTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  pendingNewTags: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRequestClose: PropTypes.func,
  onApplyTag: PropTypes.func,
  onApplyTagsAndMoveOn: PropTypes.func
};

export default ApplyTagDialog;
