import { ApolloQueryResult, gql } from "@apollo/client";
import { useTheme } from "@material-ui/core";
import Avatar from "material-ui/Avatar";
import { Card, CardActions, CardHeader, CardText } from "material-ui/Card";
import CircularProgress from "material-ui/CircularProgress";
import RaisedButton from "material-ui/RaisedButton";
import DoneIcon from "material-ui/svg-icons/action/done";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import CancelIcon from "material-ui/svg-icons/navigation/cancel";
import React from "react";
import { compose, withProps } from "recompose";

import {
  AuthzContextType,
  withAuthzContext
} from "../../../components/AuthzProvider";
import { camelCase, dataTest } from "../../../lib/attributes";
import theme from "../../../styles/theme";
import { MuiThemeProviderProps } from "../../../styles/types";
import { loadData } from "../../hoc/with-operations";
import { CampaignReadinessType } from "../types";

export interface PendingJobType {
  id: string;
  jobType: string;
  status: number;
  resultMessage: string;
}

interface DeleteJobType {
  (jobId: string): ApolloQueryResult<{ id: string }>;
}

interface WrapperProps {
  // Required Props
  campaignId: string;
  active: boolean;
  onExpandChange(expanded: boolean): void;
  onError(message: string): void;

  // Options
  title: string;

  // HOC
  isAdmin: boolean;

  // withProps
  pendingJob?: PendingJobType;
  isExpandable: boolean;
  sectionIsDone: boolean;
  deleteJob: DeleteJobType;
}

const inlineStyles: Record<string, React.CSSProperties> = {
  card: {
    marginTop: 1
  },
  title: {
    width: "100%"
  },
  avatarStyle: {
    display: "inline-block",
    verticalAlign: "middle"
  }
};

const unpackStatus = (percentComplete: number) => {
  const progressPercent =
    percentComplete > 100 ? percentComplete - 100 : percentComplete;
  const progressMessage =
    percentComplete > 100
      ? `Filtering out landlines. ${progressPercent}% complete`
      : `Uploading. ${progressPercent}% complete`;

  return { progressPercent, progressMessage };
};

const unpackJob = (job?: PendingJobType) => ({
  jobId: job ? job.id : null,
  savePercent: job ? job.status : 0,
  jobMessage: job ? job.resultMessage : "",
  isSaving:
    job !== undefined && (!job.resultMessage || job.resultMessage === "{}")
});

const SectionWrapper: React.FC<WrapperProps> = (props) => {
  const stableMuiTheme = useTheme();
  const {
    // Required props
    active,
    children,
    onExpandChange,
    onError,

    // Options
    title,

    // Authz HOC
    isAdmin,

    // withProps HOC
    isExpandable,
    pendingJob,
    sectionIsDone,
    deleteJob
  } = props;

  const { jobId, savePercent, jobMessage, isSaving } = unpackJob(pendingJob);
  const { progressPercent, progressMessage } = unpackStatus(savePercent);

  let avatar = null;
  const cardHeaderStyle: React.CSSProperties = {
    backgroundColor: theme.colors.lightGray
  };
  const avatarStyle = {
    display: "inline-block",
    verticalAlign: "middle"
  };

  if (isSaving) {
    avatar = <CircularProgress style={avatarStyle} size={25} />;
    cardHeaderStyle.background = theme.colors.lightGray;
    cardHeaderStyle.width = `${progressPercent}%`;
  } else if (active && isExpandable) {
    cardHeaderStyle.backgroundColor = stableMuiTheme.palette.warning.main;
    inlineStyles.title.color = stableMuiTheme.palette.text.primary;
  } else if (!isExpandable) {
    cardHeaderStyle.backgroundColor = theme.colors.lightGray;
    inlineStyles.title.color = stableMuiTheme.palette.text.primary;
  } else if (sectionIsDone) {
    avatar = (
      <Avatar
        icon={<DoneIcon style={{ fill: theme.colors.darkGreen }} />}
        style={avatarStyle}
        size={25}
      />
    );
    cardHeaderStyle.backgroundColor = stableMuiTheme.palette.primary.main;
    inlineStyles.title.color = stableMuiTheme.palette.text.secondary;
  } else if (!sectionIsDone) {
    avatar = (
      <Avatar
        icon={<WarningIcon style={{ fill: theme.colors.orange }} />}
        style={avatarStyle}
        size={25}
      />
    );
    cardHeaderStyle.backgroundColor = stableMuiTheme.palette.warning.main;
    inlineStyles.title.color = stableMuiTheme.palette.text.primary;
  }

  const handleDiscardJob = async () => {
    if (!jobId) return;

    // eslint-disable-next-line no-alert,no-restricted-globals
    const didConfirm = confirm(
      "Discarding the job will not necessarily stop it from running." +
        " However, if the job failed, discarding will let you try again." +
        " Are you sure you want to discard the job?"
    );

    if (!didConfirm) return;

    try {
      const response = await deleteJob(jobId);
      if (response.errors)
        throw new Error(response.errors.map((err) => `${err}`).join("\n"));
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <Card
      {...dataTest(camelCase(title))}
      expanded={active && isExpandable && !isSaving}
      expandable={isExpandable}
      onExpandChange={onExpandChange}
      style={inlineStyles.card}
    >
      <CardHeader
        title={title}
        titleStyle={inlineStyles.title}
        style={cardHeaderStyle}
        actAsExpander={isExpandable}
        showExpandableButton={isExpandable}
        avatar={avatar}
      />
      <CardText expandable>{children}</CardText>
      {isSaving && isAdmin && (
        <CardActions>
          <div>Current Status: {progressMessage}</div>
          {jobMessage && jobMessage !== "{}" && (
            <div>Message: {jobMessage}</div>
          )}
          <RaisedButton
            label="Discard Job"
            icon={<CancelIcon />}
            onClick={handleDiscardJob}
          />
        </CardActions>
      )}
    </Card>
  );
};

export const GET_CAMPAIGN_JOBS_QUERY = gql`
  query getCampaignJobs($campaignId: String!, $jobTypes: [String]) {
    campaign(id: $campaignId) {
      id
      pendingJobs(jobTypes: $jobTypes) {
        id
        jobType
        status
        resultMessage
      }
    }
  }
`;

const makeQueries = (jobTypes: string[]) => ({
  status: {
    query: gql`
      query getCampaignReadiness($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          isStarted
          isApproved
          readiness {
            id
            basics
            textingHours
            integration
            contacts
            autoassign
            cannedResponses
            interactions
            texters
            campaignGroups
          }
        }
      }
    `,
    options: (ownProps: RequiredComponentProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      },
      pollInterval: jobTypes.length > 0 ? 10 * 1000 : undefined
    })
  },
  jobs: {
    query: GET_CAMPAIGN_JOBS_QUERY,
    skip: jobTypes.length === 0,
    options: (ownProps: RequiredComponentProps) => ({
      variables: {
        campaignId: ownProps.campaignId,
        jobTypes
      },
      pollInterval: 10 * 1000
    })
  }
});

const mutations = {
  deleteJob: (ownProps: RequiredComponentProps) => (jobId: string) => ({
    mutation: gql`
      mutation deleteJob($campaignId: String!, $id: String!) {
        deleteJob(campaignId: $campaignId, id: $id) {
          id
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      id: jobId
    },
    refetchQueries: ["getCampaignJobs"]
  })
};

export interface RequiredComponentProps {
  organizationId: string;
  campaignId: string;
  active: boolean;
  isNew: boolean;
  saveLabel: string;
  onExpandChange(expanded: boolean): void;
  onError(message: string): void;
}

export interface FullComponentProps extends RequiredComponentProps {
  pendingJob?: PendingJobType;
}

export interface SectionOptions {
  title: string;
  readinessName: keyof CampaignReadinessType;
  jobQueueNames: string[];
  expandAfterCampaignStarts: boolean;
  expandableBySuperVolunteers: boolean;
}

interface WrapperGraphqlProps {
  status: {
    campaign: {
      id: string;
      isStarted: boolean;
      readiness: CampaignReadinessType;
    };
  };
  jobs?: {
    campaign: {
      id: string;
      pendingJobs: PendingJobType[];
    };
  };
  mutations: {
    deleteJob?: DeleteJobType;
  };
}

interface WrappedComponentProps
  extends RequiredComponentProps,
    MuiThemeProviderProps,
    AuthzContextType {
  pendingJob?: PendingJobType;
  isExpandable: boolean;
  sectionIsDone: boolean;
  deleteJob: DeleteJobType;
}

export const asSection = (options: SectionOptions) => (
  Component: React.ComponentType<FullComponentProps>
) =>
  compose<WrappedComponentProps, RequiredComponentProps>(
    withAuthzContext,
    loadData({
      queries: makeQueries(options.jobQueueNames),
      mutations
    }),
    withProps((ownerProps: WrapperGraphqlProps & AuthzContextType) => {
      const {
        expandableBySuperVolunteers,
        expandAfterCampaignStarts,
        readinessName
      } = options;
      const {
        status,
        jobs,
        isAdmin,
        mutations: { deleteJob }
      } = ownerProps;
      const { isStarted, readiness } = status.campaign;
      const pendingJob = jobs ? jobs.campaign.pendingJobs[0] : undefined;

      const isExpandable =
        (expandAfterCampaignStarts || !isStarted) &&
        (expandableBySuperVolunteers || isAdmin);

      const sectionIsDone = readiness[readinessName];

      return { pendingJob, isExpandable, sectionIsDone, deleteJob };
    })
  )((props) => {
    const {
      // Required props
      organizationId,
      campaignId,
      active,
      isNew,
      saveLabel,
      onExpandChange,
      onError,

      // Authz HOC
      isAdmin,
      muiTheme,

      // withProps HOC
      pendingJob,
      isExpandable,
      sectionIsDone,
      deleteJob,

      ...otherProps
    } = props;

    return (
      <SectionWrapper
        campaignId={campaignId}
        active={active}
        onExpandChange={onExpandChange}
        onError={onError}
        title={options.title}
        isAdmin={isAdmin}
        pendingJob={pendingJob}
        isExpandable={isExpandable}
        sectionIsDone={sectionIsDone}
        deleteJob={deleteJob}
        muiTheme={muiTheme}
      >
        <Component
          organizationId={organizationId}
          campaignId={campaignId}
          active={active}
          isNew={isNew}
          saveLabel={saveLabel}
          pendingJob={pendingJob}
          onExpandChange={onExpandChange}
          onError={onError}
          {...otherProps}
        />
      </SectionWrapper>
    );
  });
