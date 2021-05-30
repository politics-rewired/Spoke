import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";
import CloseIcon from "@material-ui/icons/Close";
import { css, StyleSheet } from "aphrodite";
import { ApolloQueryResult } from "apollo-client/core/types";
import orderBy from "lodash/orderBy";
import { red600 } from "material-ui/styles/colors";
import React, { useState } from "react";
import { withApollo, WithApolloClient } from "react-apollo";
import { compose } from "recompose";

import { TexterAssignmentInput } from "../../../../api/assignment";
import { Campaign } from "../../../../api/campaign";
import { User } from "../../../../api/user";
import { DateTime } from "../../../../lib/datetime";
import { MutationMap, QueryMap } from "../../../../network/types";
import theme from "../../../../styles/theme";
import { loadData } from "../../../hoc/with-operations";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  GET_CAMPAIGN_JOBS_QUERY,
  RequiredComponentProps
} from "../../components/SectionWrapper";
import AddRemoveTexters from "./components/AddRemoveTexters";
import TexterAssignmentHeaderRow from "./components/TexterAssignmentHeaderRow";
import TexterAssignmentRow from "./components/TexterAssignmentRow";
import TexterAssignmentSummary from "./components/TexterAssignmentSummary";
import { useStagedTextersReducer } from "./hooks";
import {
  EDIT_CAMPAIGN_TEXTERS,
  GET_CAMPAIGN_TEXTERS,
  GET_ORGANIZATION_TEXTERS
} from "./queries";
import { OrgTexter, Texter } from "./types";

const JOB_QUEUE_NAMES = ["assign-texters"];

const styles = StyleSheet.create({
  sliderContainer: {
    border: `1px solid ${theme.colors.lightGray}`,
    padding: 10,
    borderRadius: 8
  }
});

const inlineStyles = {
  button: {
    display: "inline-block",
    marginTop: 15
  }
};

type CampaignWithTexter = Pick<
  Campaign,
  "id" | "isStarted" | "dueBy" | "contactsCount"
> & {
  texters: Texter[];
};

interface CampaignDataResult {
  campaign: CampaignWithTexter;
}

interface HocProps extends WithApolloClient<unknown> {
  mutations: {
    editCampaign(
      payload: Values
    ): ApolloQueryResult<{ editCampaign: CampaignWithTexter }>;
  };
  campaignData: CampaignDataResult & {
    refetch(): ApolloQueryResult<CampaignDataResult>;
  };
  organizationData: {
    organization: {
      id: string;
      texters: Pick<User, "id" | "firstName" | "lastName" | "displayName">[];
    };
  };
}

interface InnerProps extends FullComponentProps, HocProps {
  orgTexters: any[];
  organizationId: string;
  contactsCount: number;
  saveLabel: string;
  saveDisabled: boolean;
}

interface Values {
  texters: {
    assignmentInputs: TexterAssignmentInput[];
    ignoreAfterDate: string;
  };
}

const CampaignTextersForm: React.FC<InnerProps> = (props) => {
  const [working, setWorking] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | undefined>(
    undefined
  );

  const {
    campaignId,
    client,
    saveDisabled,
    saveLabel,
    organizationData: {
      organization: { texters: orgTexters }
    },
    campaignData: {
      campaign: { contactsCount, texters, dueBy }
    }
  } = props;

  const activeTexters = texters.filter(
    ({ assignment }) => assignment.contactsCount > 0
  );

  const {
    lastReset,
    autoSplit,
    stagedTexters,
    assignedContactsCount,
    setAutoSplit,
    addTexters,
    removeTexter,
    removeEmptyTexters,
    assignContacts,
    reset
  } = useStagedTextersReducer(contactsCount, activeTexters);

  const resetJobsOrTexters = async () => {
    // Check for new pending jobs -- if there is one, asSection will rerender CampaignTextersForm
    // when the job completes, resetting the reducer state
    const response = await client.query({
      query: GET_CAMPAIGN_JOBS_QUERY,
      variables: { campaignId, jobTypes: JOB_QUEUE_NAMES },
      fetchPolicy: "network-only"
    });

    // If there is no pending job then the assignment job completed _much_ faster than usual and
    // we need to refresh and reset texters state ourselves
    const { pendingJobs } = response.data.campaign;
    if (pendingJobs.length === 0) {
      const {
        data: { campaign }
      } = await props.campaignData.refetch();
      reset(campaign.texters, campaign.contactsCount);
    }
  };

  const orderedTexters = orderBy(
    stagedTexters,
    ["firstName", "lastName", "id"],
    ["asc", "asc", "asc"]
  );

  const handleSplitAssignmentsToggle = (toggled: boolean) => {
    setAutoSplit(toggled);
  };

  // Campaign stuff
  const isOverdue = dueBy ? DateTime.local() >= DateTime.fromISO(dueBy) : false;
  const shouldShowTextersManager = orgTexters.length > 0;
  const finalSaveLabel = working ? "Working..." : saveLabel;
  const finalSaveDisabled = isOverdue || working || saveDisabled;

  const handleAddTexters = (newTexters: OrgTexter[]) => addTexters(newTexters);

  const handleRemoveEmptyTexters = () => removeEmptyTexters();

  const makeHandleChangeTexterAssignment = (texter: Texter) => (
    count: number
  ) => assignContacts(texter.id, count);

  const makeHandleDeleteTexter = (texter: Texter) => () =>
    removeTexter(texter.id);

  const handleSubmit = async () => {
    const { editCampaign } = props.mutations;
    const assignmentInputs = stagedTexters.map((texter) => ({
      userId: texter.id,
      contactsCount: texter.assignment.contactsCount
    }));
    const texterInput = {
      assignmentInputs,
      ignoreAfterDate: lastReset.toUTC().toISO()
    };
    setWorking(true);
    try {
      const response = await editCampaign({ texters: texterInput });
      if (response.errors) throw response.errors;
      // Force refetch of pending jobs for _this_ campaign and section -- refetchQueries wasn't doing the trick
      await resetJobsOrTexters();
    } catch (err) {
      props.onError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbarMessage(undefined);

  return (
    <>
      <CampaignFormSectionHeading
        title="Who should send the texts?"
        subtitle={
          isOverdue && (
            <span style={{ color: red600 }}>
              This campaign is overdue! Please change the due date before
              editing Texters
            </span>
          )
        }
      />
      {shouldShowTextersManager && (
        <AddRemoveTexters
          orgTexters={orgTexters}
          texters={orderedTexters}
          onAddTexters={handleAddTexters}
          onRemoveEmptyTexters={handleRemoveEmptyTexters}
        />
      )}
      <div className={css(styles.sliderContainer)}>
        <TexterAssignmentSummary
          assignedContacts={assignedContactsCount}
          contactsCount={contactsCount}
          toggled={autoSplit}
          containerStyle={{
            borderBottom: `1px solid ${theme.colors.lightGray}`,
            marginBottom: 20
          }}
          onToggleAutoSplit={handleSplitAssignmentsToggle}
        />
        <TexterAssignmentHeaderRow />
        {orderedTexters.map((stagedTexter) => (
          <TexterAssignmentRow
            key={stagedTexter.id}
            campaignContactCount={contactsCount}
            texter={stagedTexter}
            disabled={autoSplit}
            onChange={makeHandleChangeTexterAssignment(stagedTexter)}
            onDelete={makeHandleDeleteTexter(stagedTexter)}
          />
        ))}
      </div>
      <Button
        variant="contained"
        color="primary"
        style={inlineStyles.button}
        disabled={finalSaveDisabled}
        onClick={handleSubmit}
      >
        {finalSaveLabel}
      </Button>
      <Snackbar
        open={snackbarMessage !== undefined}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage ?? ""}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

const queries: QueryMap<InnerProps> = {
  campaignData: {
    query: GET_CAMPAIGN_TEXTERS,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      },
      fetchPolicy: "network-only"
    })
  },
  organizationData: {
    query: GET_ORGANIZATION_TEXTERS,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      }
    })
  }
};

const mutations: MutationMap<InnerProps> = {
  editCampaign: (ownProps) => (payload: Values) => ({
    mutation: EDIT_CAMPAIGN_TEXTERS,
    variables: {
      campaignId: ownProps.campaignId,
      payload
    }
  })
};

export default compose<InnerProps, RequiredComponentProps>(
  asSection({
    title: "Texters",
    readinessName: "texters",
    jobQueueNames: JOB_QUEUE_NAMES,
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: true
  }),
  loadData({
    queries,
    mutations
  }),
  withApollo
)(CampaignTextersForm);
