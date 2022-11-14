import PropTypes from "prop-types";
import React, { Component } from "react";
import Select from "react-select";

import MenuPortal from "./MenuPortal";

const tagStyles = {
  option: (styles, { data }) => ({
    ...styles,
    color: data.textColor
  }),
  multiValue: (styles, { data }) => ({
    ...styles,
    background: data.backgroundColor
  }),
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: data.textColor
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: data.textColor
  })
};

class TagSelector extends Component {
  // differentiate select and clear tag actions
  handleSelectChange = (tagsArray) => {
    const { dataSource, onChange } = this.props;

    const selectedTags = [];
    tagsArray.forEach((tag) => {
      const newTag = dataSource.find((t) => t.id === tag.value);
      if (newTag) selectedTags.push({ tag: newTag });
    });
    onChange(selectedTags);
  };

  render() {
    const { dataSource, value } = this.props;
    const menuOptions = dataSource.map((tag) => ({
      label: tag.title,
      value: tag.id,
      textColor: tag.textColor,
      backgroundColor: tag.backgroundColor
    }));
    const menuValues = value.map((tag) => ({
      value: tag.tag.id,
      label: tag.tag.title,
      textColor: tag.tag.textColor,
      backgroundColor: tag.tag.backgroundColor
    }));

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
          styles={tagStyles}
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
        .isRequired,
      textColor: PropTypes.string.isRequired,
      backgroundColor: PropTypes.string.isRequired
    })
  ),
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      confirmationSteps: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string))
        .isRequired,
      textColor: PropTypes.string.isRequired,
      backgroundColor: PropTypes.string.isRequired
    })
  ),
  onChange: PropTypes.func
};

export default TagSelector;
