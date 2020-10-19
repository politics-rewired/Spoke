import React, { Component } from "react";
import PropTypes from "prop-types";

import Select, { components } from "react-select";

import MenuPortal from "./MenuPortal";
import ApplyTagConfirmationDialog from "../ApplyTagConfirmationDialog";

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

  // remove a tag
  handleRemoveTag = tagsArray => {
    const { value, onChange } = this.props;
    const preservedTagIds = tagsArray.map(tag => tag.value);
    const preservedTags = value.filter(tag => preservedTagIds.includes(tag.id));
    if (preservedTags.length < value.length) {
      onChange(preservedTags);
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

  // differentiate select and clear tag actions
  handleSelectChange = (
    tagsArray,
    { action: selectAction, option: selectedTag }
  ) => {
    if (selectAction === "select-option") {
      this.handleSelectTag(selectedTag);
    }
    if (selectAction === "remove-value") {
      this.handleRemoveTag(tagsArray);
    }
  };

  // select a tag
  handleSelectTag = selectedTag => {
    const { dataSource } = this.props;
    const { value: newTagId } = selectedTag;
    const newTag = dataSource.find(t => t.id === newTagId);
    this.addTag(newTag);
  };

  render() {
    const { pendingTag } = this.state;
    const { dataSource, value } = this.props;
    const menuOptions = dataSource.map(tag => ({
      label: tag.title,
      value: tag.id
    }));
    const menuValues = value.map(tag => ({ value: tag.id, label: tag.title }));

    return (
      <div>
        <p>Apply tags:</p>
        <Select
          isMulti
          isSearchable
          value={menuValues}
          components={{ MenuPortal }}
          options={menuOptions}
          menuPortalTarget={document.body}
          onChange={this.handleSelectChange}
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
