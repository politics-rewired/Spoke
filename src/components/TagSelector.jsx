import React, { Component } from "react";
import PropTypes from "prop-types";

import ChipInput from "material-ui-chip-input";

import ApplyTagConfirmationDialog from "./ApplyTagConfirmationDialog";

class TagSelector extends Component {
  state = {
    pendingTag: undefined
  };

  // Prevent user-defined tags
  handleBeforeRequestAdd = ({ id: tagId, title }) =>
    !isNaN(tagId) && tagId !== title;

  handleRequestAddTag = ({ id: tagId }) => {
    const { dataSource } = this.props;

    const newTag = dataSource.find(tag => tag.id === tagId);

    if (newTag.confirmationSteps.length > 0) {
      return this.setState({ pendingTag: newTag });
    }

    this.addTag(newTag);
  };

  handleRemoveTag = deleteTagId => {
    const { value, onChange } = this.props;
    const newTags = value.filter(tag => tag.id !== deleteTagId);
    if (newTags.length < value.length) {
      onChange(newTags);
    }
  };

  handleCancelConfirmTag = () => this.setState({ pendingTag: undefined });

  handleConfirmAddTag = newTag => {
    this.addTag(newTag);
    this.handleCancelConfirmTag();
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

  render() {
    const { pendingTag } = this.state;
    const { dataSource, value } = this.props;

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
        <ApplyTagConfirmationDialog
          pendingTag={pendingTag}
          onCancel={this.handleCancelConfirmTag}
          onConfirm={this.handleConfirmAddTag}
        />
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
      confirmationSteps: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string))
        .isRequired
    })
  ),
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      confirmationSteps: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string))
        .isRequired
    })
  ),
  onChange: PropTypes.func
};

export default TagSelector;
