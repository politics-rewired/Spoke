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
import React, { useState } from "react";
import { RouteChildrenProps } from "react-router-dom";
import {
  BooleanParam,
  NumberParam,
  StringParam,
  useQueryParam
} from "use-query-params";

import { TrollAlarm } from "../../api/trollbot";
import { dataSourceItem, DataSourceItemType } from "../../components/utils";
import { MutationMap, QueryMap } from "../../network/types";
import { loadData } from "../hoc/with-operations";
import TrollAlarmList from "./components/TrollAlarmList";

const styles = {
  controlsContainer: {
    padding: "10px",
    display: "flex",
    alignItems: "baseline"
  },
  controlsColumn: { flexGrow: 1, flexBasis: 1 }
};

interface Props
  extends Pick<RouteChildrenProps<{ organizationId: string }>, "match"> {
  // HOC
  trollTokens: {
    trollTokens: {
      token: string;
    }[];
  };
  mutations: {
    dismissAlarms: (alarmIds: string[]) => Promise<void>;
    dismissMatchingAlarms: (token: string) => Promise<void>;
  };
}

const AdminTrollAlarms: React.FC<Props> = (props) => {
  // UI Widgets
  const [tokenSearchText, setTokenSearchText] = useState("");
  const [copiedAlarmID, setCopiedAlarmID] = useState<string | undefined>(
    undefined
  );

  // Operations
  const [selectedAlarmIds, setSelectedAlarmIds] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Query params
  const [pageSize, setPageSize] = useQueryParam("pageSize", NumberParam);
  const [page, setPage] = useQueryParam("page", NumberParam);
  const [dismissed, setDismissed] = useQueryParam("dismissed", BooleanParam);
  const [token, setToken] = useQueryParam("token", StringParam);

  const handleOnCancelError = () => setError(undefined);

  // Query conditions
  const handleFocusTokenSearch = () => {
    setTokenSearchText("");
    setToken(null);
  };

  const handleTokenSearchTextChange = (newTokenSearchText: string) =>
    setTokenSearchText(newTokenSearchText);

  const handleTokenSelected = (
    selection: DataSourceItemType | string,
    index: number
  ) => {
    let foundToken: string | null = null;
    if (index > -1 && typeof selection !== "string") {
      foundToken = selection.value.key as string;
    } else {
      const { trollTokens } = props.trollTokens;
      foundToken =
        trollTokens.find(({ token: trollToken }) => trollToken === selection)
          ?.token ?? null;
    }
    if (foundToken) {
      setToken(foundToken);
      setSelectedAlarmIds([]);
    }
  };

  const handleToggleDismissed = (_event: any, newDismissed: boolean) => {
    setPage(0);
    setDismissed(newDismissed);
    setSelectedAlarmIds([]);
  };

  // Actions
  const handleDismissSelected = async () => {
    setIsWorking(true);
    setError(undefined);
    try {
      await props.mutations.dismissAlarms(selectedAlarmIds);
      setSelectedAlarmIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDismissMatching = async () => {
    if (!token) return;

    setIsWorking(true);
    setError(undefined);
    try {
      await props.mutations.dismissMatchingAlarms(token);
      setSelectedAlarmIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDismissCopyAlarm = () => setCopiedAlarmID(undefined);

  const handleCopyAlarm = (alarm: TrollAlarm) => {
    const clipboardContents = [
      `Triggered Token: ${alarm.token}`,
      `Campaign ID: ${alarm.contact.campaign.id}`,
      `Contact Name: ${alarm.contact.firstName} ${alarm.contact.lastName}`,
      `Message ID: ${alarm.messageId}`,
      `Message Text: ${alarm.messageText}`,
      `User ID: ${alarm.user.id}`,
      `User Name: ${alarm.user.displayName}`,
      `User Email: ${alarm.user.email}`
    ].join("\n");

    try {
      navigator.clipboard.writeText(clipboardContents);
      setCopiedAlarmID(alarm.id);
    } catch (err) {
      setError(err.message);
    }
  };

  // Table selection
  const handleAlarmSelectionChange = (newSelectedAlarmIds: string[]) =>
    setSelectedAlarmIds(newSelectedAlarmIds);

  // Pagination
  const handlePageSizeChange = (newPageSize: number) =>
    setPageSize(newPageSize);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const { match } = props;

  const { trollTokens } = props.trollTokens;
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
      onClick={handleOnCancelError}
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
          value={token ?? undefined}
          maxSearchResults={8}
          searchText={tokenSearchText}
          dataSource={dataSource}
          filter={AutoComplete.caseInsensitiveFilter}
          onFocus={handleFocusTokenSearch}
          onUpdateInput={handleTokenSearchTextChange}
          onNewRequest={handleTokenSelected}
        />
        <Toggle
          label="Dismissed Alarms"
          style={{ ...styles.controlsColumn, width: "0px" }}
          onToggle={handleToggleDismissed}
          toggled={dismissed}
        />
        <RaisedButton
          label={`Dismiss All Matching ${deleteAllSuffix}`}
          style={{ marginRight: "10px" }}
          secondary
          disabled={token === null}
          onClick={handleDismissMatching}
        />
        <RaisedButton
          label={`Dismiss Selected (${selectedAlarmIds.length})`}
          secondary
          disabled={isDeleteSelectedDisabled}
          onClick={handleDismissSelected}
        />
      </Paper>
      <br />
      <TrollAlarmList
        organizationId={match?.params.organizationId}
        pageSize={pageSize ?? 25}
        page={page ?? 0}
        dismissed={dismissed ?? false}
        token={token ?? null}
        selectedAlarmIds={selectedAlarmIds}
        onAlarmSelectionChange={handleAlarmSelectionChange}
        onPageSizeChange={handlePageSizeChange}
        onPageChange={handlePageChange}
        onCopyAlarm={handleCopyAlarm}
      />
      <Dialog open={error !== undefined} onClose={handleOnCancelError}>
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
        onRequestClose={handleDismissCopyAlarm}
      />
    </div>
  );
};

const queries: QueryMap<Props> = {
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
        organizationId: ownProps.match?.params.organizationId
      }
    })
  }
};

const mutations: MutationMap<Props> = {
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
      organizationId: ownProps.match?.params.organizationId,
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
      organizationId: ownProps.match?.params.organizationId,
      token
    },
    refetchQueries: ["getTrollAlarmsForOrg"]
  })
};

export default loadData({
  queries,
  mutations
})(AdminTrollAlarms);
