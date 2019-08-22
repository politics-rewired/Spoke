import React from "react";
import PropTypes from "prop-types";

import Chip from "material-ui/Chip";
import SelectField from "material-ui/SelectField";
import TextField from "material-ui/TextField";
import MenuItem from "material-ui/MenuItem";
import IconButton from "material-ui/IconButton";
import DeleteForeverIcon from "material-ui/svg-icons/action/delete-forever";
import { red500 } from "material-ui/styles/colors";

import { TextRequestType } from "../../api/organization";

const AssignmentRow = props => {
  const {
    assignment,
    canBeNoneType,
    isRowDisabled,
    onChange,
    onDelete
  } = props;
  const { teamName, assignmentType, maxCount } = assignment;

  const handleChangeAssignmentType = (_event, _index, assignmentType) =>
    onChange({ assignmentType });
  const handleChangeMaxCount = (_event, maxCount) => onChange({ maxCount });

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Chip style={{ display: "inline-block" }}>{teamName}</Chip>
      <div style={{ flexGrow: 1 }} />
      <SelectField
        style={{ marginLeft: "10px" }}
        floatingLabelText="Assignment Type"
        value={assignmentType}
        disabled={isRowDisabled}
        onChange={handleChangeAssignmentType}
      >
        {canBeNoneType && <MenuItem value={"NONE"} primaryText="Disabled" />}
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
        style={{ marginLeft: "10px", width: "90px" }}
        floatingLabelText="Max Count"
        type="number"
        value={maxCount}
        disabled={isRowDisabled}
        onChange={handleChangeMaxCount}
      />
      <IconButton disabled={isRowDisabled} onClick={onDelete}>
        <DeleteForeverIcon color={red500} />
      </IconButton>
    </div>
  );
};

AssignmentRow.defaultProps = {
  canBeNoneType: false,
  isRowDisabled: false,
  onDelete: () => {}
};

AssignmentRow.propTypes = {
  assignment: PropTypes.shape({
    teamId: PropTypes.string.isRequired,
    teamName: PropTypes.string.isRequired,
    assignmentType: PropTypes.string.isRequired,
    maxCount: PropTypes.number.isRequired
  }).isRequired,
  canBeNoneType: PropTypes.bool,
  isRowDisabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func
};

export default AssignmentRow;
