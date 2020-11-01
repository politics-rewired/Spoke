import React, { Component } from "react";
import type from "prop-types";

import Select, { createFilter } from "react-select";
import { Card, CardHeader, CardText } from "material-ui/Card";
import { Tabs, Tab } from "material-ui/Tabs";
import Dialog from "material-ui/Dialog";
import { getHighestRole } from "../lib/permissions";
import FlatButton from "material-ui/FlatButton";
import { css, StyleSheet } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    alignItems: "center"
  },
  flexColumn: {
    flex: 0,
    flexBasis: "30%",
    display: "flex"
  },
  spacer: {
    marginRight: "30px"
  }
});

const formatTexter = (texter) => {
  const { displayName, email, role } = texter;
  return `${displayName} (${email}) ${role}`;
};

const MenuList = (props) => {
  const children = props.children;

  if (!children.length) {
    return <div>{children}</div>;
  }

  return (
    <div>
      {children.length &&
        children.slice(0, 5).map((key, i) => {
          delete key.props.innerProps.onMouseMove; //FIX LAG!!
          delete key.props.innerProps.onMouseOver; //FIX LAG!!

          return <div key={i}>{key}</div>;
        })}
    </div>
  );
};

class IncomingMessageActions extends Component {
  state = {
    selectedTexters: [],
    confirmDialogOpen: false
  };

  onReassignmentClicked = () => {
    const { selectedTexters } = this.state;
    const texterIds = selectedTexters.map((texter) => texter.value);
    this.props.onReassignRequested(texterIds);
  };

  onUnassignClicked = () => {
    this.props.onUnassignRequested();
  };

  onReassignAllMatchingClicked = () => {
    this.setState({ confirmDialogOpen: "reassign" });
  };

  onUnassignAllMatchingClicked = () => {
    this.setState({ confirmDialogOpen: "unassign" });
  };

  handleTextersChanged = (selectedTexters) => {
    this.setState({ selectedTexters });
  };

  handleConfirmDialogCancel = () => {
    this.setState({ confirmDialogOpen: false });
  };

  handleConfirmDialogReassign = () => {
    this.setState({ confirmDialogOpen: false });
    const { selectedTexters } = this.state;
    const texterIds = selectedTexters.map((texter) => texter.value);
    this.props.onReassignAllMatchingRequested(texterIds);
  };

  handleConfirmDialogUnassign = () => {
    this.setState({ confirmDialogOpen: false });
    this.props.onUnassignAllMatchingRequested();
  };

  render() {
    let texters = this.props.people || [];
    texters = texters.map((texter) => ({
      value: parseInt(texter.id, 10),
      label: formatTexter(texter)
    }));

    const confirmDialogActions = (actionVerb, confirmAction) => [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleConfirmDialogCancel}
      />,
      <FlatButton
        label={actionVerb || "Reassign"}
        primary={true}
        onClick={confirmAction}
      />
    ];

    const { contactsAreSelected, conversationCount } = this.props;
    const { selectedTexters } = this.state;
    const hasSeletedTexters = selectedTexters.length > 0;
    return (
      <Card>
        <CardHeader
          title={" Message Actions "}
          actAsExpander
          showExpandableButton
        />
        <CardText expandable>
          <Tabs>
            <Tab label="Reassign">
              <div>
                <p>
                  <Select
                    components={{ MenuList }}
                    onChange={this.handleTextersChanged}
                    filterOption={createFilter({ ignoreAccents: false })}
                    options={texters}
                    isMulti
                    placeholder="Select at least one texter"
                  />
                </p>
              </div>

              <div className={css(styles.container)}>
                <div className={css(styles.flexColumn)}>
                  <FlatButton
                    label={"Reassign selected"}
                    onClick={this.onReassignmentClicked}
                    disabled={!contactsAreSelected || !hasSeletedTexters}
                  />
                </div>
                <div className={css(styles.flexColumn)}>
                  <FlatButton
                    label={`Reassign all ${conversationCount} matching`}
                    onClick={this.onReassignAllMatchingClicked}
                    disabled={conversationCount === 0}
                  />
                </div>
                <Dialog
                  actions={confirmDialogActions(
                    "Reassign",
                    this.handleConfirmDialogReassign
                  )}
                  open={this.state.confirmDialogOpen == "reassign"}
                  modal={true}
                  onRequestClose={this.handleConfirmDialogCancel}
                >
                  {`Reassign all ${conversationCount} matching conversations?`}
                </Dialog>
              </div>
            </Tab>
            <Tab label="Unassign">
              <div className={css(styles.container)}>
                <div className={css(styles.flexColumn)}>
                  <FlatButton
                    label={"Unassign selected"}
                    onClick={this.onUnassignClicked}
                    disabled={!contactsAreSelected}
                  />
                </div>
                <div className={css(styles.flexColumn)}>
                  <FlatButton
                    label={`Unassign all ${conversationCount} matching`}
                    onClick={this.onUnassignAllMatchingClicked}
                    disabled={conversationCount === 0}
                  />
                </div>
                <Dialog
                  actions={confirmDialogActions(
                    "Unassign",
                    this.handleConfirmDialogUnassign
                  )}
                  open={this.state.confirmDialogOpen == "unassign"}
                  modal={true}
                  onRequestClose={this.handleConfirmDialogCancel}
                >
                  {`Unassign all ${conversationCount} matching conversations?`}
                </Dialog>
              </div>
            </Tab>
          </Tabs>

          {/* <br/>
          <div>
            <FlatButton
              label="Reset Message Status"
              primary={true}
              onClick={this.props.markForSecondPass}
              disabled={!this.props.contactsAreSelected}
            />
          </div> */}
        </CardText>
      </Card>
    );
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  conversationCount: type.number
};

export default IncomingMessageActions;
