import React, { Component } from "react";
import PropTypes from "prop-types";

import ReactMarkdown from "react-markdown";
import ChipInput from "material-ui-chip-input";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

class TagSelector extends Component {
  state = {
    pendingTag: undefined,
    confirmStepIndex: -1
  };

  // Prevent user-defined tags
  handleBeforeRequestAdd = ({ id: tagId, title }) =>
    !isNaN(tagId) && tagId !== title;

  handleRequestAddTag = ({ id: tagId }) => {
    const { dataSource } = this.props;

    const newTag = dataSource.find(tag => tag.id === tagId);

    if (newTag.confirmationSteps.length > 0) {
      return this.setState({ pendingTag: newTag, confirmStepIndex: 0 });
    }

    this.addTag(newTag);
  };

  handleRemoveTag = deleteTagId => {
    const { dataSource, onChange } = this.props;
    const newTags = dataSource.filter(tag => tag.id !== deleteTagId);
    onChange(newTags);
  };

  addTag = newTag => {
    const { value, onChange } = this.props;

    const tagAlreadySelected =
      value.findIndex(existingTag => existingTag.id === newTag.id) > -1;

    if (!tagAlreadySelected) {
      const newValue = [...value, newTag];
      onChange(newValue);
    }
  };

  handleCloseConfirm = () =>
    this.setState({ pendingTag: undefined, confirmStepIndex: -1 });

  handleConfirmStep = () => {
    const { pendingTag, confirmStepIndex } = this.state;
    const { confirmationSteps } = pendingTag;

    if (confirmStepIndex < confirmationSteps.length - 1)
      return this.setState({ confirmStepIndex: confirmStepIndex + 1 });

    this.addTag(pendingTag);
    this.handleCloseConfirm();
  };

  render() {
    const { pendingTag, confirmStepIndex } = this.state;
    const { dataSource, value } = this.props;

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
        <p>Apply tags:</p>
        <ChipInput
          value={value}
          dataSourceConfig={{ text: "title", value: "id" }}
          dataSource={dataSource}
          fullWidth={true}
          openOnFocus={true}
          onBeforeRequestAdd={this.handleBeforeRequestAdd}
          onRequestAdd={this.handleRequestAddTag}
          onRequestDelete={this.handleRemoveTag}
        />
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

TagSelector.defaultProps = {
  dataSource: [],
  value: [],
  onChange: () => {}
};

TagSelector.propTypes = {
  dataSource: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      confirmationSteps: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ),
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      confirmationSteps: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  onChange: PropTypes.func
};

export default TagSelector;
