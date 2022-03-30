import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Snackbar from "@material-ui/core/Snackbar";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Alert from "@material-ui/lab/Alert";
import {
  useCampaignsEligibleForAutosendingQuery,
  usePauseAutosendingMutation,
  useStartAutosendingMutation
} from "@spoke/spoke-codegen";
import { sortBy } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BooleanParam, useQueryParam, withDefault } from "use-query-params";

import LoadingIndicator from "../../components/LoadingIndicator";
import AutosendingTargetRow from "./components/AutosendingTargetRow";
import AutosendingUnstartedTargetRow from "./components/AutosendingUnstartedTargetRow";

const AdminAutosending: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [isStarted = true, setIsStarted] = useQueryParam(
    "isStarted",
    withDefault(BooleanParam, true)
  );

  const {
    data,
    loading,
    error: getCampaignsError
  } = useCampaignsEligibleForAutosendingQuery({
    variables: { organizationId, isStarted },
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

  const handleChangeFilter = useCallback(
    (
      event: React.ChangeEvent<{
        name?: string | undefined;
        value: unknown;
      }>
    ) => setIsStarted(event.target.value === "started"),
    [setIsStarted]
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
  const activeCampaigns = sortBy(
    campaigns.filter(
      (c) =>
        c.autosendStatus && ["paused", "sending"].includes(c.autosendStatus)
    ),
    (c) => c.id
  );

  const inactiveCampaigns = sortBy(
    campaigns.filter(
      (c) =>
        c.autosendStatus && !["paused", "sending"].includes(c.autosendStatus)
    ),
    (c) => c.id
  );

  const sortedCampaigns = activeCampaigns.concat(inactiveCampaigns);

  const actionsDisabled = isStartingAutosending || isPausingAutosending;

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
          <FormControl>
            <InputLabel id="is-started-select-label">
              Campaign Status
            </InputLabel>
            <Select
              labelId="is-started-select-label"
              id="is-started-select"
              value={isStarted ? "started" : "unstarted"}
              style={{ width: 200, marginRight: 10 }}
              onChange={handleChangeFilter}
            >
              <MenuItem value="started">Started</MenuItem>
              <MenuItem value="unstarted">Unstarted</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell colSpan={5}>Progress</TableCell>
                <TableCell colSpan={2}>Engagement</TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Status</TableCell>
                {/* Actions */}
                <TableCell />
                <TableCell>Contacts</TableCell>
                <TableCell>Delivered</TableCell>
                <TableCell>Waiting to Send</TableCell>
                <TableCell>Waiting to Deliver</TableCell>
                <TableCell>Failed</TableCell>
                <TableCell>Replies</TableCell>
                <TableCell>Opt Outs</TableCell>
                <TableCell>More Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCampaigns.map((c) =>
                c.isStarted ? (
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
                )
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
