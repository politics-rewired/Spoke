import Chip from "@material-ui/core/Chip";
import Grid from "@material-ui/core/Grid";
import uniqBy from "lodash/uniqBy";
import ChipInput from "material-ui-chip-input";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import TextField from "material-ui/TextField";
import Toggle from "material-ui/Toggle";
import React from "react";

import { TextRequestType } from "../../../api/types";
import type { TagWithTitle, TeamForAssignment } from "./types";

type TagChip = {
  id: string;
  title: string;
};

interface Props {
  assignmentPool: TeamForAssignment;
  escalationTagList: TagWithTitle[];
  isRowDisabled: boolean;
  onChange: (payload: any) => Promise<void> | void;
}

const AssignmentRow: React.FC<Props> = (props) => {
  const {
    assignmentPool,
    isRowDisabled = false,
    onChange,
    escalationTagList
  } = props;

  const handleToggleIsEnabled = (
    _event: React.MouseEvent<unknown, MouseEvent>,
    isAssignmentEnabled: boolean
  ) => onChange({ isAssignmentEnabled });

  const handleChangeAssignmentType = (
    _event: React.SyntheticEvent<unknown, Event>,
    _index: number,
    assignmentType: any
  ) => onChange({ assignmentType });

  const handleChangeMaxCount = (
    _event: React.FormEvent<unknown>,
    maxRequestCount: string
  ) =>
    onChange({
      maxRequestCount: maxRequestCount ? parseInt(maxRequestCount, 10) : null
    });

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

  const handleCheckEscalationTag = (newTag: TagChip | string) => {
    // when a tag is added by search, newTag will be a string,
    // not the tag object within escalationTagList -
    // here we trim possible whitespace, then verify the tag
    const formattedTag =
      typeof newTag === "string" ? newTag.trim() : newTag.title;
    const tagNames = escalationTagList.map((tag) => tag.title);
    const tagExists = tagNames.includes(formattedTag);

    return tagExists;
  };

  const handleAddEscalationTag = (newTag: TagChip) => {
    // when a tag is added by search, ChipInput coerces it to an object -
    // we want to find the tag within escalationTagList that matches
    // newTag object's title, not add the new object to escalationTags
    const foundTag = escalationTagList.find(
      (tag) => tag.title === newTag.title
    );
    if (!foundTag) return;
    const newEscalationTags = uniqBy(
      escalationTags.concat(foundTag),
      (t) => t.id
    );
    onChange({ escalationTags: newEscalationTags });
  };

  const handleRemoveEscalationTag = (oldTagId: string) => {
    const newEscalationTags = escalationTags.filter(
      (tag) => tag.id !== oldTagId
    );
    onChange({ escalationTags: newEscalationTags });
  };

  const isSaveDisabled =
    isRowDisabled || !isAssignmentEnabled || id === "general";

  return (
    <Grid container spacing={2} wrap="nowrap" alignItems="center">
      <Grid item>
        <Chip label={title} style={{ color: textColor, backgroundColor }} />
      </Grid>
      <Grid item>
        <Toggle
          label="Enable assignment?"
          labelPosition="right"
          toggled={isAssignmentEnabled}
          disabled={isRowDisabled}
          onToggle={handleToggleIsEnabled}
        />
      </Grid>
      <Grid item>
        <SelectField
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
      </Grid>
      <Grid item>
        <TextField
          floatingLabelText="Max to request at once"
          type="number"
          value={maxRequestCount}
          disabled={isRowDisabled || !isAssignmentEnabled}
          onChange={handleChangeMaxCount}
        />
      </Grid>
      <Grid item>
        <ChipInput
          floatingLabelText={
            id === "general" ? "N/A" : "Custom escalation tags"
          }
          openOnFocus
          dataSource={escalationTagList}
          dataSourceConfig={{ text: "title", value: "id" }}
          value={escalationTags}
          onBeforeRequestAdd={handleCheckEscalationTag}
          onRequestAdd={handleAddEscalationTag}
          onRequestDelete={handleRemoveEscalationTag}
          disabled={isSaveDisabled}
        />
      </Grid>
    </Grid>
  );
};

export default AssignmentRow;
