import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import { css } from "aphrodite";
import React from "react";

import { UserRoleType } from "../../../../../api/organization-membership";
import { dataTest } from "../../../../../lib/attributes";
import theme from "../../../../../styles/theme";
import { useDebouncedValue } from "../hooks";
import type { Texter } from "../types";
import rowStyles from "./rowStyles";
import Slider from "./Slider";

interface Props {
  texter: Texter;
  campaignContactCount: number;
  disabled?: boolean;
  onChange?: (count: number) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

const TexterAssignmentRow: React.FC<Props> = (props) => {
  const {
    texter,
    campaignContactCount,
    disabled = false,
    onChange,
    onDelete
  } = props;

  const {
    displayName,
    roles,
    assignment: { contactsCount, needsMessageCount }
  } = texter;
  const messagedCount = contactsCount - needsMessageCount;

  const handleDebouncedVal = (value: number) => {
    if (onChange) onChange(value);
  };
  const [debouncedContactCount, debounceContactCount] = useDebouncedValue(
    contactsCount,
    handleDebouncedVal
  );

  const handleOnChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const value = parseInt(e.currentTarget.value, 10) ?? 0;
    debounceContactCount(value);
  };

  // Strip synthetic event arg
  const handleOnDelete = () => {
    if (onDelete) onDelete();
  };

  return (
    <div className={css(rowStyles.texterRow)} {...dataTest("texterRow")}>
      <div className={css(rowStyles.leftSlider)}>
        <Slider
          maxValue={campaignContactCount}
          value={messagedCount}
          color={theme.colors.darkGray}
          direction={1}
        />
      </div>
      <div className={css(rowStyles.assignedCount)}>{messagedCount}</div>
      <div {...dataTest("texterName")} className={css(rowStyles.nameColumn)}>
        {roles?.includes(UserRoleType.SUSPENDED)
          ? `${displayName} (SUSPENDED)`
          : displayName}
      </div>
      <div className={css(rowStyles.input)}>
        <TextField
          id="assigned-contacts"
          label="Contacts"
          type="number"
          InputLabelProps={{
            shrink: true
          }}
          style={{ marginTop: "-16px" }}
          value={debouncedContactCount}
          disabled={disabled}
          {...dataTest("texterAssignment")}
          onChange={handleOnChange}
        />
      </div>
      <div className={css(rowStyles.slider)}>
        <Slider
          maxValue={campaignContactCount}
          value={needsMessageCount}
          color={theme.colors.green}
          direction={0}
        />
      </div>
      <div className={css(rowStyles.removeButton)}>
        <IconButton onClick={handleOnDelete}>
          <DeleteIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default TexterAssignmentRow;
