import Chip from "material-ui/Chip";
import { Card, CardHeader, CardText } from "material-ui/Card";
import Snackbar from "material-ui/Snackbar";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import Paper from "@material-ui/core/Paper";
import TableRow from "@material-ui/core/TableRow";
import PauseIcon from "material-ui/svg-icons/av/pause";
import PlayIcon from "material-ui/svg-icons/av/play-arrow";
import MoreIcon from "material-ui/svg-icons/navigation/arrow-forward";
import React from "react";
import {
  useCampaignsEligibleForAutosendingQuery,
  useStartAutosendingMutation,
  usePauseAutosendingMutation
} from "@spoke/spoke-codegen";
import LoadingIndicator from "../../components/LoadingIndicator";
import { match } from "react-router";
import { FlatButton } from "material-ui";
import {
  green100,
  green400,
  red200,
  red600,
  grey200
} from "material-ui/styles/colors";
import { sortBy } from "lodash";
import { Link } from "react-router-dom";

interface Props {
  match: match<{ organizationId: string }>;
}

const AdminAutosending: React.FC<Props> = (props) => {
  const organizationId = props.match.params.organizationId;
  const { data, loading } = useCampaignsEligibleForAutosendingQuery({
    variables: { organizationId }
  });

  const [
    startAutosending,
    { loading: _isStartingAutosending, error: startAutosendingError }
  ] = useStartAutosendingMutation();

  const [
    pauseAutosending,
    { loading: _isPausingAutosending, error: pauseAutosendingError }
  ] = usePauseAutosendingMutation();

  if (loading) {
    return <LoadingIndicator />;
  }

  const mutationError = startAutosendingError || pauseAutosendingError;
  const errorSnackbar = mutationError ? (
    <Snackbar
      open={true}
      message={mutationError.message.replace("GraphQL error:", "")}
      autoHideDuration={2000}
    />
  ) : undefined;

  const campaigns = data?.organization?.campaigns?.campaigns;
  const activeCampaigns = sortBy(
    campaigns!.filter((c) => {
      const camp = c!;
      return ["paused", "sending"].includes(camp.autosendStatus);
    }),
    (c) => c?.id
  );

  const inactiveCampaigns = sortBy(
    campaigns!.filter((c) => {
      const camp = c!;
      return !["paused", "sending"].includes(camp.autosendStatus);
    }),
    (c) => c.id
  );

  const sortedCampaigns = activeCampaigns.concat(inactiveCampaigns);

  return (
    <Card>
      {errorSnackbar}
      <CardHeader
        title="Autosending Controls"
        subtitle="Campaigns will send in order of ID"
      />
      <CardText>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Campaign</TableCell>
                <TableCell>Status</TableCell>
                <TableCell></TableCell>
                <TableCell>Contacts</TableCell>
                <TableCell>Delivered</TableCell>
                <TableCell>Replies</TableCell>
                <TableCell>Opt Outs</TableCell>
                <TableCell>Waiting to Send</TableCell>
                <TableCell>Waiting to Deliver</TableCell>
                <TableCell>Failed</TableCell>
                <TableCell>More Info</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCampaigns.map((c) => {
                const row = c!;

                const campaignId = row.id!;

                const totalSent = row.stats?.countMessagedContacts;

                const statusChipDisplay =
                  row.autosendStatus === "sending"
                    ? totalSent === 0
                      ? "up next"
                      : row.autosendStatus
                    : row.autosendStatus;

                const chipColor =
                  statusChipDisplay === "sending"
                    ? green400
                    : statusChipDisplay === "paused"
                    ? red200
                    : statusChipDisplay === "complete"
                    ? green100
                    : grey200;

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      {campaignId}: {row.title}
                    </TableCell>
                    <TableCell>
                      <Chip backgroundColor={chipColor}>
                        {statusChipDisplay}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {row.autosendStatus ===
                      "complete" ? undefined : row.autosendStatus ===
                        "sending" ? (
                        <FlatButton
                          label="Pause"
                          icon={<PauseIcon />}
                          onClick={() =>
                            pauseAutosending({
                              variables: { campaignId }
                            })
                          }
                        />
                      ) : (
                        <FlatButton
                          label="Queue"
                          icon={<PlayIcon />}
                          onClick={() =>
                            startAutosending({ variables: { campaignId } })
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>{row.contactsCount}</TableCell>

                    <TableCell>
                      {row.deliverabilityStats.deliveredCount}
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          color:
                            row.stats?.percentUnhandledReplies > 25
                              ? red600
                              : "black"
                        }}
                      >
                        {row.stats?.receivedMessagesCount}
                      </span>
                    </TableCell>
                    <TableCell>{row.stats?.optOutsCount}</TableCell>
                    <TableCell>{row.contactsCount - totalSent}</TableCell>
                    <TableCell>
                      {row.deliverabilityStats.sendingCount}
                    </TableCell>
                    <TableCell>{row.deliverabilityStats.errorCount}</TableCell>
                    <TableCell>
                      <Link to={`/admin/1/campaigns/${row.id}`}>
                        <MoreIcon />
                      </Link>
                    </TableCell>
                  </TableRow>
                  // <div style={{ display: "flex", alignItems: "center" }}>
                  //   <div style={{ minWidth: "200px" }}>
                  //     <Chip style={{ display: "inline-block" }}>{row.title}</Chip>
                  //   </div>

                  //   <div style={{ minWidth: "200px" }}>
                  //     <Chip style={{ display: "inline-block" }}>
                  //       {row.autosendStatus}
                  //     </Chip>
                  //   </div>
                  // </div>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardText>
    </Card>
  );
};

// const AdminAutosendingRow: React.FC()

export default AdminAutosending;
