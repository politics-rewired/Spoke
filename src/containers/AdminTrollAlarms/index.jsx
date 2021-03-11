import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import gql from "graphql-tag";
import AutoComplete from "material-ui/AutoComplete";
import FlatButton from "material-ui/FlatButton";
import Paper from "material-ui/Paper";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import Toggle from "material-ui/Toggle";
import PropTypes from "prop-types";
import React from "react";

import { dataSourceItem } from "../../components/utils";
import { loadData } from "../hoc/with-operations";
import TrollAlarmList from "./components/TrollAlarmList";

const styles = {
  controlsContainer: {
    padding: "10px",
    display: "flex",
    alignItems: "baseline"
  },
  controlsColumn: { flexGrow: "1", flexBasis: "1" }
};

class AdminTrollAlarms extends React.Component {
  state = {
    // UI Widgets
    tokenSearchText: "",
    copiedAlarmID: undefined,

    // Query params
    pageSize: 25,
    page: 0,
    dismissed: false,
    token: null,

    // Operations
    selectedAlarmIds: [],
    isWorking: false,
    error: undefined
  };

  handleOnCancelError = () => this.setState({ error: undefined });

  // Query conditions
  handleFocusTokenSearch = () =>
    this.setState({ tokenSearchText: "", token: null });

  handleTokenSearchTextChange = (tokenSearchText) =>
    this.setState({ tokenSearchText });

  handleTokenSelected = (selection, index) => {
    let token = null;
    if (index > -1) {
      token = selection.value.key;
    } else {
      const { trollTokens } = this.props.trollTokens;
      token = trollTokens.find(
        ({ token: trollToken }) => trollToken === selection
      );
    }
    if (token) {
      this.setState({ token, selectedAlarmIds: [] });
    }
  };

  handleToggleDismissed = (_event, dismissed) =>
    this.setState({ dismissed, selectedAlarmIds: [] });

  // Actions
  handleDismissSelected = async () => {
    const { selectedAlarmIds } = this.state;
    this.setState({ isWorking: true, error: undefined });
    try {
      await this.props.mutations.dismissAlarms(selectedAlarmIds);
      this.setState({ selectedAlarmIds: [] });
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleDismissMatching = async () => {
    const { token } = this.state;
    this.setState({ isWorking: true, error: undefined });
    try {
      await this.props.mutations.dismissMatchingAlarms(token);
      this.setState({ selectedAlarmIds: [] });
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleDismissCopyAlarm = () => this.setState({ copiedAlarmID: undefined });

  handleCopyAlarm = (alarm) => {
    const clipboardContents = [
      `Triggered Token: ${alarm.token}`,
      `Message ID: ${alarm.messageId}`,
      `Message Text: ${alarm.messageText}`,
      `User ID: ${alarm.user.id}`,
      `User Name: ${alarm.user.displayName}`,
      `User Email: ${alarm.user.email}`
    ].join("\n");

    try {
      navigator.clipboard.writeText(clipboardContents);
      this.setState({ copiedAlarmID: alarm.id });
    } catch (err) {
      this.setState({ error: err.message });
    }
  };

  // Table selection
  handleAlarmSelectionChange = (selectedAlarmIds) =>
    this.setState({ selectedAlarmIds });

  // Pagination
  handlePageSizeChange = (pageSize) => this.setState({ pageSize });

  handlePageChange = (page) => this.setState({ page });

  render() {
    const { tokenSearchText, copiedAlarmID } = this.state;
    const { pageSize, page, dismissed, token } = this.state;
    const { selectedAlarmIds, isWorking, error } = this.state;
    const { match } = this.props;

    const { trollTokens } = this.props.trollTokens;
    const dataSource = trollTokens.map(({ token: trollToken }) =>
      dataSourceItem(trollToken, trollToken)
    );

    const deleteAllSuffix = token ? `"${token}"` : "Token";
    const isDeleteSelectedDisabled = selectedAlarmIds.length === 0 || isWorking;

    const errorActions = [
      <FlatButton
        key="close"
        label="Close"
        primary
        onClick={this.handleOnCancelError}
      />
    ];

    return (
      <div>
        <Paper style={styles.controlsContainer}>
          <AutoComplete
            floatingLabelText="Token"
            hintText="Search for a trigger token"
            style={{ marginRight: "10px", ...styles.controlsColumn }}
            fullWidth
            maxSearchResults={8}
            searchText={tokenSearchText}
            dataSource={dataSource}
            filter={AutoComplete.caseInsensitiveFilter}
            onFocus={this.handleFocusTokenSearch}
            onUpdateInput={this.handleTokenSearchTextChange}
            onNewRequest={this.handleTokenSelected}
          />
          <Toggle
            label="Dismissed Alarms"
            style={{ ...styles.controlsColumn, width: "0px" }}
            onToggle={this.handleToggleDismissed}
            toggled={dismissed}
          />
          <RaisedButton
            label={`Dismiss All Matching ${deleteAllSuffix}`}
            style={{ marginRight: "10px" }}
            secondary
            disabled={token === null}
            onClick={this.handleDismissMatching}
          />
          <RaisedButton
            label={`Dismiss Selected (${selectedAlarmIds.length})`}
            secondary
            disabled={isDeleteSelectedDisabled}
            onClick={this.handleDismissSelected}
          />
        </Paper>
        <br />
        <TrollAlarmList
          organizationId={match.params.organizationId}
          pageSize={pageSize}
          page={page}
          dismissed={dismissed}
          token={token}
          selectedAlarmIds={selectedAlarmIds}
          onAlarmSelectionChange={this.handleAlarmSelectionChange}
          onPageSizeChange={this.handlePageSizeChange}
          onPageChange={this.handlePageChange}
          onCopyAlarm={this.handleCopyAlarm}
        />
        <Dialog open={error !== undefined} onClose={this.handleOnCancelError}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            <DialogContentText>{error || ""}</DialogContentText>
          </DialogContent>
          <DialogActions>{errorActions}</DialogActions>
        </Dialog>
        <Snackbar
          open={copiedAlarmID !== undefined}
          message={`Alarm ${copiedAlarmID || ""} details copied to clipboard`}
          autoHideDuration={4000}
          onRequestClose={this.handleDismissCopyAlarm}
        />
      </div>
    );
  }
}

AdminTrollAlarms.propTypes = {
  // HOC props
  match: PropTypes.object.isRequired,
  trollTokens: PropTypes.shape({
    trollTokens: PropTypes.arrayOf(
      PropTypes.shape({
        token: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired
};

const queries = {
  trollTokens: {
    query: gql`
      query getTrollTokensForOrg($organizationId: String!) {
        trollTokens(organizationId: $organizationId) {
          token
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations = {
  dismissAlarms: (ownProps) => (alarmIds) => ({
    mutation: gql`
      mutation dismissSelectedTrollBotAlarms(
        $organizationId: String!
        $alarmIds: [String!]!
      ) {
        dismissAlarms(messageIds: $alarmIds, organizationId: $organizationId)
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      alarmIds
    },
    refetchQueries: ["getTrollAlarmsForOrg"]
  }),
  dismissMatchingAlarms: (ownProps) => (token) => ({
    mutation: gql`
      mutation dismissMatchingTrollBotAlarms(
        $organizationId: String!
        $token: String!
      ) {
        dismissMatchingAlarms(token: $token, organizationId: $organizationId)
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      token
    },
    refetchQueries: ["getTrollAlarmsForOrg"]
  })
};

export default loadData({
  queries,
  mutations
})(AdminTrollAlarms);
