import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Snackbar from "@material-ui/core/Snackbar";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Alert from "@material-ui/lab/Alert";
import {
  AutosendingControlsMode,
  useCampaignsEligibleForAutosendingQuery,
  usePauseAutosendingMutation,
  useStartAutosendingMutation
} from "@spoke/spoke-codegen";
import { isNil, sortBy } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BooleanParam, useQueryParam, withDefault } from "use-query-params";

import { useSpokeContext } from "../../client/spoke-context";
import LoadingIndicator from "../../components/LoadingIndicator";
import AutosendingBasicTargetRow from "./components/AutosendingBasicTargetRow";
import AutosendingBasicUnstartedTargetRow from "./components/AutosendingBasicUnstartedTargetRow";
import AutosendingTargetRow from "./components/AutosendingTargetRow";
import AutosendingUnstartedTargetRow from "./components/AutosendingUnstartedTargetRow";

const useStyles = makeStyles({
  select: { width: 150, marginRight: 10 }
});

const AdminAutosending: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { orgSettings } = useSpokeContext();
  const defaultBasic =
    orgSettings?.defaultAutosendingControlsMode ===
    AutosendingControlsMode.Basic;

  const [isStarted, setIsStarted] = useQueryParam(
    "isStarted",
    withDefault(BooleanParam, true)
  );
  const [isBasic, setIsBasic] = useQueryParam(
    "isBasic",
    withDefault(BooleanParam, defaultBasic)
  );

  const {
    data,
    loading,
    error: getCampaignsError
  } = useCampaignsEligibleForAutosendingQuery({
    variables: { organizationId, isStarted, isBasic },
    pollInterval: 10 * 1000
  });

  const [
    startAutosending,
    { loading: isStartingAutosending, error: startAutosendingError }
  ] = useStartAutosendingMutation();

  const [
    pauseAutosending,
    { loading: isPausingAutosending, error: pauseAutosendingError }
  ] = usePauseAutosendingMutation();

  const [alertErrorMessage, setAlertErrorMessage] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (getCampaignsError) setAlertErrorMessage(getCampaignsError.message);
  }, [getCampaignsError?.message]);
  useEffect(() => {
    if (startAutosendingError)
      setAlertErrorMessage(startAutosendingError.message);
  }, [startAutosendingError?.message]);
  useEffect(() => {
    if (pauseAutosendingError)
      setAlertErrorMessage(pauseAutosendingError.message);
  }, [pauseAutosendingError?.message]);

  const handleChangeStartedFilter = useCallback(
    (
      event: React.ChangeEvent<{
        name?: string | undefined;
        value: unknown;
      }>
    ) => setIsStarted(event.target.value === "started"),
    [setIsStarted]
  );

  const handleChangeModeFilter = useCallback(
    (
      event: React.ChangeEvent<{
        name?: string | undefined;
        value: unknown;
      }>
    ) => {
      setIsBasic(event.target.value === AutosendingControlsMode.Basic);
    },
    [setIsBasic]
  );

  const handleDismissAlert = useCallback(
    () => setAlertErrorMessage(undefined),
    [setAlertErrorMessage]
  );

  const handlePlayFactory = useCallback(
    (campaignId: string) => () =>
      startAutosending({ variables: { campaignId } }),
    [startAutosending]
  );

  const handlePauseFactory = useCallback(
    (campaignId: string) => () =>
      pauseAutosending({ variables: { campaignId } }),
    [pauseAutosending]
  );

  const campaigns = data?.organization?.campaigns.campaigns ?? [];
  const activeStatus = ["paused", "sending", "holding"];

  const activeCampaigns = sortBy(
    campaigns.filter(
      (c) => c.autosendStatus && activeStatus.includes(c.autosendStatus)
    ),
    (c) => c.id
  );

  const inactiveCampaigns = sortBy(
    campaigns.filter(
      (c) => c.autosendStatus && !activeStatus.includes(c.autosendStatus)
    ),
    (c) => c.id
  );

  const sortedCampaigns = activeCampaigns.concat(inactiveCampaigns);
  const actionsDisabled = isStartingAutosending || isPausingAutosending;
  const inlineStyles = useStyles();

  return (
    <Card>
      <Snackbar
        open={alertErrorMessage !== undefined}
        autoHideDuration={6000}
        onClose={handleDismissAlert}
      >
        <Alert onClose={handleDismissAlert} severity="error">
          {alertErrorMessage?.replace("GraphQL error:", "")}
        </Alert>
      </Snackbar>
      <CardHeader
        title="Autosending Controls"
        subtitle="Campaigns will send in order of ID"
        action={
          <>
            <FormControl>
              <InputLabel id="is-started-select-label">
                Campaign Status
              </InputLabel>
              <Select
                labelId="is-started-select-label"
                id="is-started-select"
                value={isStarted ? "started" : "unstarted"}
                classes={{ root: inlineStyles.select }}
                onChange={handleChangeStartedFilter}
              >
                <MenuItem value="started">Started</MenuItem>
                <MenuItem value="unstarted">Unstarted</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="autosend-controls-mode-select-label">
                Display Mode
              </InputLabel>
              <Select
                labelId="autosend-controls-mode-select-label"
                id="autosend-controls-mode-select"
                value={
                  isBasic
                    ? AutosendingControlsMode.Basic
                    : AutosendingControlsMode.Detailed
                }
                classes={{ root: inlineStyles.select }}
                onChange={handleChangeModeFilter}
              >
                <MenuItem value={AutosendingControlsMode.Basic}>Basic</MenuItem>
                <MenuItem value={AutosendingControlsMode.Detailed}>
                  Detailed
                </MenuItem>
              </Select>
            </FormControl>
          </>
        }
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              {isBasic ? null : (
                <TableRow>
                  <TableCell colSpan={3} />
                  <TableCell colSpan={5}>Progress</TableCell>
                  <TableCell colSpan={2}>Engagement</TableCell>
                  <TableCell />
                </TableRow>
              )}
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Autosending Status</TableCell>
                {/* Actions */}
                <TableCell />
                {isBasic ? null : (
                  <>
                    <TableCell>Contacts</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>Waiting to Send</TableCell>
                    <TableCell>Waiting to Deliver</TableCell>
                    <TableCell>Failed</TableCell>
                    <TableCell>Replies</TableCell>
                    <TableCell>Opt Outs</TableCell>
                  </>
                )}
                <TableCell>More Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCampaigns.map((c) => {
                if (isNil(c.deliverabilityStats?.sendingCount)) {
                  return c.isStarted ? (
                    <AutosendingBasicTargetRow
                      key={c.id}
                      target={c}
                      organizationId={organizationId}
                      disabled={actionsDisabled}
                      onStart={handlePlayFactory(c!.id!)}
                      onPause={handlePauseFactory(c!.id!)}
                    />
                  ) : (
                    <AutosendingBasicUnstartedTargetRow
                      key={c.id}
                      target={c}
                      organizationId={organizationId}
                    />
                  );
                }
                return c.isStarted ? (
                  <AutosendingTargetRow
                    key={c.id}
                    target={c}
                    organizationId={organizationId}
                    disabled={actionsDisabled}
                    onStart={handlePlayFactory(c!.id!)}
                    onPause={handlePauseFactory(c!.id!)}
                  />
                ) : (
                  <AutosendingUnstartedTargetRow
                    key={c.id}
                    target={c}
                    organizationId={organizationId}
                  />
                );
              })}
              {sortedCampaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} style={{ textAlign: "center" }}>
                    No campaigns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {loading && <LoadingIndicator />}
      </CardContent>
    </Card>
  );
};

export default AdminAutosending;
