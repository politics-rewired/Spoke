import FormControlLabel from "@material-ui/core/FormControlLabel";
import { WithTheme, withTheme } from "@material-ui/core/styles";
import Switch from "@material-ui/core/Switch";
import { css, StyleSheet } from "aphrodite";
import React from "react";

import { dataTest } from "../../../../../lib/attributes";
import theme from "../../../../../styles/theme";

const styles = StyleSheet.create({
  splitToggle: {
    ...theme.text.body,
    flex: "1 1 50%"
  },
  headerContainer: {
    display: "flex"
  }
});

const inlineStyles = {
  header: {
    ...theme.text.header
  },
  splitAssignmentToggle: {
    width: "auto",
    marginLeft: "auto"
  }
};

interface Props extends WithTheme {
  assignedContacts: number;
  contactsCount: number;
  toggled: boolean;
  containerStyle?: React.CSSProperties;
  onToggleAutoSplit?: (toggled: boolean) => void;
}

const TexterAssignmentSummary: React.FC<Props> = (props) => {
  const {
    assignedContacts,
    contactsCount,
    toggled,
    theme: stableMuiTheme,
    containerStyle,
    onToggleAutoSplit
  } = props;
  const headerColor =
    assignedContacts === contactsCount
      ? stableMuiTheme.palette.primary.main
      : stableMuiTheme.palette.warning.main;

  const handleOnToggle = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    if (onToggleAutoSplit) onToggleAutoSplit(checked);
  };

  const numberUnassigned = contactsCount - assignedContacts;
  return (
    <div className={css(styles.headerContainer)} style={containerStyle}>
      <div
        style={{
          ...inlineStyles.header,
          color: headerColor,
          flex: "1 1 50%"
        }}
      >
        <div>Assigned Contacts: {assignedContacts}</div>
        <div>Left unassigned: {numberUnassigned}</div>
      </div>
      <div className={css(styles.splitToggle)}>
        <FormControlLabel
          control={
            <Switch
              checked={toggled}
              style={inlineStyles.splitAssignmentToggle}
              {...dataTest("autoSplit")}
              onChange={handleOnToggle}
              name="autoSplit"
            />
          }
          label="Split remaining unsent messages"
        />
      </div>
    </div>
  );
};

export default withTheme(TexterAssignmentSummary);
