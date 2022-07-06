import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import PropTypes from "prop-types";
import React, { Component } from "react";

import ApplyTagConfirmationDialog from "../../components/ApplyTagConfirmationDialog";
import TagSelector from "../../components/TagSelector";
import theme from "../../styles/theme";

const isEscalateTag = (t) => t.title === "Escalated" || t.title === "Escalate";
const isNonAssignableTagApplied = (appliedTags) =>
  appliedTags.findIndex((t) => !t.isAssignable) > -1;

class ApplyTagDialog extends Component {
  state = {
    selectedTags: [],
    pendingTag: undefined
  };

  UNSAFE_componentWillMount() {
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.selectedTags = this.props.pendingNewTags;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
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

    const hasNonAssignableTag = isNonAssignableTagApplied(selectedTags);

    const saveActions = hasNonAssignableTag
      ? [
          <Button
            key="save-without-message"
            color="primary"
            onClick={this.handleApplyTagsAndMoveOn}
          >
            Save and Move On Without a Message
          </Button>
        ]
      : [
          <Button
            key="save-with-message"
            color="primary"
            onClick={this.handleApplyTags}
          >
            Save and Type Message
          </Button>,
          <Button
            key="save-without-message"
            color="primary"
            onClick={this.handleApplyTagsAndMoveOn}
          >
            Save and Move On Without a Message
          </Button>
        ];

    const selectTagActions = saveActions.concat([
      <Button key="save" color="primary" onClick={this.props.onRequestClose}>
        Cancel
      </Button>
    ]);

    return (
      <div id="applyTagDialog">
        <Dialog
          open={open}
          maxWidth="xl"
          fullWidth
          onClose={this.props.onRequestClose}
        >
          <DialogTitle>More Actions</DialogTitle>
          <DialogContent>
            {!!escalateTag && (
              <Button
                variant="contained"
                color="secondary"
                style={{ paddingLeft: 20, paddingRight: 20 }}
                onClick={this.handleAddEscalatedTag}
              >
                Escalate Conversation
              </Button>
            )}
            {hasNonAssignableTag ? (
              <p style={{ color: theme.colors.red }}>
                You've selected a tag that will cause the conversation to become
                unassigned, and you will not be able to send a follow up.
              </p>
            ) : null}
            <TagSelector
              value={selectedTags}
              dataSource={tagsWithoutEscalated}
              onChange={this.handleOnTagChange}
            />
          </DialogContent>
          <DialogActions>{selectTagActions}</DialogActions>
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
