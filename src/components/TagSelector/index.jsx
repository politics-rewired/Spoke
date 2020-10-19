import React, { Component } from "react";
import PropTypes from "prop-types";

import Select from "react-select";

import MenuPortal from "./MenuPortal";

const customStyles = { menu: base => ({ ...base, backGround: "red" }) };

class TagSelector extends Component {
  state = {
    pendingTag: undefined
  };

  // differentiate select and clear tag actions
  handleSelectChange = tagsArray => {
    const { dataSource, onChange } = this.props;

    let selectedTags = [];
    tagsArray.forEach(tag => {
      const newTag = dataSource.find(t => t.id === tag.value);
      selectedTags.push(newTag);
    });
    onChange(selectedTags);
  };

  render() {
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
          styles={customStyles}
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
