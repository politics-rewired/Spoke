import uniqBy from "lodash/uniqBy";
import ChipInput from "material-ui-chip-input";
import Chip from "material-ui/Chip";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import PropTypes from "prop-types";
import React from "react";

import { TextRequestType } from "../../api/organization";

const AssignmentRow = (props) => {
  const { assignmentPool, isRowDisabled, onChange, escalationTagList } = props;

  const handleToggleIsEnabled = (_event, isAssignmentEnabled) =>
    onChange({ isAssignmentEnabled });

  const handleChangeAssignmentType = (_event, _index, assignmentType) =>
    onChange({ assignmentType });

  const handleChangeMaxCount = (_event, maxRequestCount) =>
    onChange({ maxRequestCount: parseInt(maxRequestCount, 10) });

  const {
    id,
    title,
    textColor,
    backgroundColor,
    isAssignmentEnabled,
    assignmentType,
    maxRequestCount,
    escalationTags
  } = assignmentPool;

  const handleCheckEscalationTag = (newTag) => {
    // when a tag is added by search, newTag will be a string,
    // not the tag object within escalationTagList -
    // here we trim possible whitespace, then verify the tag
    const formattedTag = newTag.id ? newTag.title : newTag.trim();
    const tagNames = escalationTagList.map((tag) => tag.title);
    const tagExists = tagNames.includes(formattedTag);

    return tagExists;
  };

  const handleAddEscalationTag = (newTag) => {
    // when a tag is added by search, ChipInput coerces it to an object -
    // we want to find the tag within escalationTagList that matches
    // newTag object's title, not add the new object to escalationTags
    const foundTag = escalationTagList.find(
      (tag) => tag.title === newTag.title
    );
    const newEscalationTags = uniqBy(
      escalationTags.concat(foundTag),
      (t) => t.id
    );
    onChange({ escalationTags: newEscalationTags });
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ minWidth: "200px" }}>
        <Chip
          style={{ display: "inline-block" }}
          labelColor={textColor}
          backgroundColor={backgroundColor}
        >
          {title}
        </Chip>
      </div>
      <div>
        <Toggle
          label="Enable assignment?"
          labelPosition="right"
          toggled={isAssignmentEnabled}
          disabled={isRowDisabled}
          style={{ display: "inline-block" }}
          onToggle={handleToggleIsEnabled}
        />
      </div>
      <div style={{ flex: 1 }} />
      <SelectField
        style={{ marginLeft: "20px" }}
        floatingLabelText="Assignment Type"
        value={assignmentType}
        disabled={isRowDisabled || !isAssignmentEnabled}
        onChange={handleChangeAssignmentType}
      >
        <MenuItem
          value={TextRequestType.UNSENT}
          primaryText="Unsent Initial Messages"
        />
        <MenuItem
          value={TextRequestType.UNREPLIED}
          primaryText="Unhandled Replies"
        />
      </SelectField>
      <TextField
        style={{ marginLeft: "10px" }}
        floatingLabelText="Max to request at once"
        type="number"
        value={maxRequestCount}
        disabled={isRowDisabled || !isAssignmentEnabled}
        onChange={handleChangeMaxCount}
      />
      <ChipInput
        style={{
          marginLeft: "10px"
        }}
        floatingLabelText={id === "general" ? "N/A" : "Custom escalation tags"}
        dataSource={escalationTagList}
        value={escalationTags}
        onBeforeRequestAdd={handleCheckEscalationTag}
        onRequestAdd={handleAddEscalationTag}
      />
    </div>
  );
};

AssignmentRow.defaultProps = {
  isRowDisabled: false
};

AssignmentRow.propTypes = {
  assignmentPool: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    textColor: PropTypes.string.isRequired,
    backgroundColor: PropTypes.string.isRequired,
    isAssignmentEnabled: PropTypes.bool.isRequired,
    assignmentType: PropTypes.string.isRequired,
    maxRequestCount: PropTypes.number.isRequired,
    escalationTags: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  escalationTagList: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  ).isRequired,
  isRowDisabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

export default AssignmentRow;
