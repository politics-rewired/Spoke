import React, { Component } from "react";
import PropTypes from "prop-types";

import ChipInput from "material-ui-chip-input";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

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

  handleSelectTags = (_e, _key, tagsArray) => {
    // tagsArray is an array of tag ids currently selected in dropdownMenu
    const { dataSource, value } = this.props;

    // determine new tags
    const valuesIds = value.map(tag => tag.id);
    const newTagIds = tagsArray.filter(tagId => !valuesIds.includes(tagId));

    // when a new tag is selected
    newTagIds.forEach(tagId => {
      const newTag = dataSource.find(t => t.id === tagId);
      console.log("newTag", newTag, "dataSource", dataSource);
      if (newTag.confirmationSteps.length > 0) {
        return this.setState({ pendingTag: newTag });
      }

      this.addTag(newTag);
    });
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
          placeholder="Type to search tags"
          maxHeight={200}
          dataSource={dataSource}
          fullWidth={true}
          // openOnFocus={true}
          onBeforeRequestAdd={this.handleBeforeRequestAdd}
          onRequestAdd={this.handleRequestAddTag}
          onRequestDelete={this.handleRemoveTag}
        />
        <SelectField
          hintText="Or find them via dropdown"
          style={{ width: "100%", maxWidth: "none" }}
          multiple
          autoWidth={false}
          maxHeight={300}
          onChange={this.handleSelectTags}
        >
          {dataSource.map(tag => (
            <MenuItem key={tag.id} value={tag.id} primaryText={tag.title} />
          ))}
        </SelectField>
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
