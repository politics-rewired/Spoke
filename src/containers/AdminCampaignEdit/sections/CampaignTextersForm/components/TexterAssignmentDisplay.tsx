import { WithTheme, withTheme } from "@material-ui/core/styles";
import { css, StyleSheet } from "aphrodite";
import Toggle from "material-ui/Toggle";
import React from "react";

import { dataTest } from "../../../../../lib/attributes";
import theme from "../../../../../styles/theme";

const styles = StyleSheet.create({
  removeButton: {
    width: 50
  },
  texterRow: {
    display: "flex",
    flexDirection: "row"
  },
  alreadyTextedHeader: {
    textAlign: "right",
    fontWeight: 600,
    fontSize: 16
  },
  availableHeader: {
    fontWeight: 600,
    fontSize: 16
  },
  nameColumn: {
    width: 100,
    textOverflow: "ellipsis",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  splitToggle: {
    ...theme.text.body,
    flex: "1 1 50%"
  },
  slider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  leftSlider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  headerContainer: {
    display: "flex",
    borderBottom: `1px solid ${theme.colors.lightGray}`,
    marginBottom: 20
  },
  assignedCount: {
    width: 40,
    fontSize: 16,
    paddingLeft: 5,
    paddingRight: 5,
    textAlign: "center",
    marginTop: "auto",
    marginBottom: "auto",
    marginRight: 10,
    display: "inline-block",
    backgroundColor: theme.colors.lightGray
  },
  input: {
    width: 50,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 10,
    marginTop: "auto",
    marginBottom: "auto",
    display: "inline-block"
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
  handleSplitAssignmentsToggle(event: any, toggled: boolean): void;
}

const TexterAssignmentDisplay = (props: Props) => {
  const {
    assignedContacts,
    contactsCount,
    toggled,
    theme: stableMuiTheme,
    handleSplitAssignmentsToggle
  } = props;
  const headerColor =
    assignedContacts === contactsCount
      ? stableMuiTheme.palette.primary.main
      : stableMuiTheme.palette.warning.main;

  const numberUnassigned = contactsCount - assignedContacts;
  return (
    <div>
      <div className={css(styles.headerContainer)}>
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
          <Toggle
            {...dataTest("autoSplit")}
            label="Split assignments"
            style={inlineStyles.splitAssignmentToggle}
            toggled={toggled}
            onToggle={handleSplitAssignmentsToggle}
          />
        </div>
      </div>
      <div className={css(styles.texterRow)}>
        <div className={css(styles.leftSlider, styles.alreadyTextedHeader)}>
          Already texted
        </div>
        <div className={css(styles.assignedCount)} />
        <div className={css(styles.nameColumn)} />
        <div className={css(styles.input)} />
        <div className={css(styles.slider, styles.availableHeader)}>
          Available to assign
        </div>
        <div className={css(styles.removeButton)} />
      </div>
    </div>
  );
};

export default withTheme(TexterAssignmentDisplay);
