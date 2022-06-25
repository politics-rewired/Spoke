import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import {
  AssignmentTarget,
  RequestAutoApprove,
  useGetCurrentUserFormInfoQuery,
  User,
  useRequestTextsMutation
} from "@spoke/spoke-codegen";
import isNil from "lodash/isNil";
import React, { useMemo, useState } from "react";
import * as yup from "yup";

import GSForm from "./forms/GSForm";
import LoadingIndicator from "./LoadingIndicator";

interface TexterRequestProps {
  organizationId: string;
  user: User;
}

export const TexterRequest: React.FC<TexterRequestProps> = ({
  organizationId,
  user
}) => {
  const { email } = user;
  const [count, setCount] = useState<number | undefined>(undefined);
  const [preferredTeamId, setPreferredTeamId] = useState<string | undefined>(
    undefined
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [finished, setFinished] = useState(false);

  const { data, loading: currentUserLoading } = useGetCurrentUserFormInfoQuery({
    variables: { organizationId },
    fetchPolicy: "network-only",
    pollInterval: 5000,
    onCompleted: (fetchData) => {
      const myCurrentAssignmentTargets =
        fetchData.organization?.myCurrentAssignmentTargets ?? [];
      const firstAssignmentTarget = myCurrentAssignmentTargets[0];
      if (!preferredTeamId && firstAssignmentTarget?.teamId) {
        setPreferredTeamId(firstAssignmentTarget.teamId);
      }
      if (!count && !isNil(firstAssignmentTarget?.maxRequestCount)) {
        setCount(firstAssignmentTarget!.maxRequestCount);
      }
    }
  });

  const [requestTexts, { loading: requestLoading }] = useRequestTextsMutation();

  const maxRequestCount = useMemo(() => {
    const assignmentTargets =
      data?.organization?.myCurrentAssignmentTargets ?? [];
    const selection = assignmentTargets.find(
      (at) => at?.teamId === preferredTeamId
    );
    return selection?.maxRequestCount ?? undefined;
  }, [preferredTeamId, data]);

  const userCanRequest = useMemo(() => {
    const membership = (data?.currentUser?.memberships?.edges ?? [])
      .map(({ node }) => node)
      .find(({ organization }) => organization.id === organizationId);
    const useAutoApprove = membership?.requestAutoApprove;
    return useAutoApprove
      ? useAutoApprove !== RequestAutoApprove.DoNotApprove
      : false;
  }, [organizationId, data]);

  const myCurrentAssignmentTargets = useMemo(
    () => data?.organization?.myCurrentAssignmentTargets ?? [],
    [data]
  );

  const orgSettings = useMemo(() => data?.organization?.settings, [data]);

  const submit = async () => {
    if (
      currentUserLoading ||
      requestLoading ||
      !preferredTeamId ||
      !email ||
      !count
    )
      return;

    setErrorMessage(undefined);
    try {
      const response = await requestTexts({
        variables: { organizationId, email, preferredTeamId, count }
      });
      if (response.errors) throw response.errors[0];

      const message = response.data?.requestTexts ?? "";

      if (message.includes("Created")) {
        setFinished(true);
      } else if (message === "Unrecognized email") {
        setErrorMessage(
          `Unrecognized email: please make sure you're logged into Spoke with the same email as Slack.`
        );
      } else if (
        message === "Not created; a shift already requested < 10 mins ago."
      ) {
        setErrorMessage("Sorry - you just requested! Please wait 10 minutes.");
      } else if (message === "No texts available at the moment") {
        setErrorMessage(message);
      } else {
        setFinished(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const setSelectedAssignment = (
    event: React.ChangeEvent<{
      name?: string | undefined;
      value: unknown;
    }>
  ) => {
    const teamId = event.target.value as string;
    const selection = myCurrentAssignmentTargets.find(
      (at) => at?.teamId === teamId
    );

    setPreferredTeamId(teamId);
    setCount(
      count && selection?.maxRequestCount
        ? Math.min(count, selection.maxRequestCount)
        : selection?.maxRequestCount ?? undefined
    );
  };

  const handleChangeCount = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const formVal = parseInt(e.target.value, 10) || 0;
    let newCount =
      maxRequestCount && maxRequestCount > 0
        ? Math.min(maxRequestCount, formVal)
        : formVal;
    newCount = Math.max(newCount, 0);
    setCount(newCount);
  };

  if (currentUserLoading) {
    return <LoadingIndicator />;
  }

  const textsAvailable = myCurrentAssignmentTargets.length > 0;

  if (data?.currentUser?.currentRequest) {
    const { amount } = data.currentUser.currentRequest;

    return (
      <Paper>
        <div style={{ padding: "20px" }}>
          <h3> You currently have a pending request</h3>
          <p>
            You requested {amount} texts. Hold on, someone will approve them
            soon!
          </p>
        </div>
      </Paper>
    );
  }

  if (!userCanRequest && orgSettings?.showDoNotAssignMessage) {
    return (
      <Paper>
        <div style={{ padding: "20px" }}>
          <h3>Assignment Request Disabled</h3>
          <p>{orgSettings.doNotAssignMessage}</p>
        </div>
      </Paper>
    );
  }

  if (!textsAvailable) {
    return (
      <Paper>
        <div style={{ padding: "20px" }}>
          <h3> No texts available right now </h3>
          <p> Watch out for an announcement when new texts are available! </p>
        </div>
      </Paper>
    );
  }

  const inputSchema = yup.object({
    count: yup.number().required(),
    email: yup.string().required()
  });

  if (finished) {
    return (
      <div>
        <h3> Submitted Successfully – Thank you! </h3>
        <p>
          {" "}
          Give us a few minutes to assign your texts. You'll receive an email
          notification when we've done so. If you requested your texts after
          hours, you’ll get them when texting opens at 9am ET :).{" "}
        </p>
      </div>
    );
  }

  const makeOptionText = (at: AssignmentTarget) =>
    `${at.teamTitle}: ${at.maxRequestCount ?? ""} ${
      at.type === "UNSENT" ? "Initials" : "Replies"
    }`;

  return (
    <div>
      <h1> Ready to text? </h1>
      {data ? (
        <FormControl>
          <InputLabel id="assignment-select-label">
            Pick an assignment
          </InputLabel>
          <Select
            labelId="assignment-select-label"
            value={preferredTeamId ?? ""}
            onChange={setSelectedAssignment}
            fullWidth
          >
            {myCurrentAssignmentTargets.map((at) => (
              <MenuItem key={at.teamId!} value={at.teamId!}>
                {makeOptionText(at)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <LoadingIndicator />
      )}
      <GSForm schema={inputSchema} value={{ email, count }} onSubmit={submit}>
        <TextField
          name="count"
          label="Count"
          type="number"
          value={count ?? ""}
          onChange={handleChangeCount}
        />
        <br />
        <Button
          variant="contained"
          color="primary"
          disabled={requestLoading}
          fullWidth
          onClick={submit}
        >
          Request More Texts
        </Button>
      </GSForm>
      {errorMessage && (
        <div style={{ color: "red" }}>
          <p> {errorMessage} </p>
        </div>
      )}
    </div>
  );
};

export default TexterRequest;
