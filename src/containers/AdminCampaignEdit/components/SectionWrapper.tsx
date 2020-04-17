import React from "react";
import gql from "graphql-tag";
import { compose, withProps } from "recompose";
import { ApolloQueryResult } from "apollo-client";

import Avatar from "material-ui/Avatar";
import { Card, CardHeader, CardText, CardActions } from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";
import CircularProgress from "material-ui/CircularProgress";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import DoneIcon from "material-ui/svg-icons/action/done";
import CancelIcon from "material-ui/svg-icons/navigation/cancel";

import { CampaignReadinessType } from "../types";
import { withAuthzContext } from "../../../components/AuthzProvider";
import { loadData } from "../../hoc/with-operations";
import { dataTest, camelCase } from "../../../lib/attributes";
import theme from "../../../styles/theme";

interface PendingJobType {
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
  adminPerms: boolean;

  // withProps
  pendingJob?: PendingJobType;
  isExpandable: boolean;
  sectionIsDone: boolean;
  deleteJob: DeleteJobType;
}

const inlineStyles = {
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
  isSaving: job !== undefined && !job.resultMessage
});

const SectionWrapper: React.SFC<WrapperProps> = props => {
  const {
    // Required props
    active,
    children,
    onExpandChange,
    onError,

    // Options
    title,

    // Authz HOC
    adminPerms,

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
    cardHeaderStyle.backgroundColor = theme.colors.lightYellow;
  } else if (!isExpandable) {
    cardHeaderStyle.backgroundColor = theme.colors.lightGray;
  } else if (sectionIsDone) {
    avatar = (
      <Avatar
        icon={<DoneIcon style={{ fill: theme.colors.darkGreen }} />}
        style={avatarStyle}
        size={25}
      />
    );
    cardHeaderStyle.backgroundColor = theme.colors.green;
  } else if (!sectionIsDone) {
    avatar = (
      <Avatar
        icon={<WarningIcon style={{ fill: theme.colors.orange }} />}
        style={avatarStyle}
        size={25}
      />
    );
    cardHeaderStyle.backgroundColor = theme.colors.yellow;
  }

  const handleDiscardJob = async () => {
    if (!jobId) return;

    const didConfirm = confirm(
      "Discarding the job will not necessarily stop it from running." +
        " However, if the job failed, discarding will let you try again." +
        " Are you sure you want to discard the job?"
    );

    if (!didConfirm) return;

    try {
      const response = await deleteJob(jobId);
      if (response.errors)
        throw new Error(response.errors.map(err => `${err}`).join("\n"));
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
      {isSaving &&
        adminPerms && (
          <CardActions>
            <div>Current Status: {progressMessage}</div>
            {jobMessage && <div>Message: {jobMessage}</div>}
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

const makeQueries = (hasJobQueues: boolean) => ({
  status: {
    query: gql`
      query getCampaignReadiness($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          isStarted
          readiness {
            id
            basics
            textingHours
            contacts
            autoassign
          }
        }
      }
    `,
    options: (ownProps: RequiredComponentProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      },
      pollInterval: hasJobQueues ? 10 * 1000 : undefined
    })
  },
  jobs: {
    query: gql`
      query getCampaignJobs($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          pendingJobs {
            id
            jobType
            status
            resultMessage
          }
        }
      }
    `,
    skip: !hasJobQueues,
    options: (ownProps: RequiredComponentProps) => ({
      variables: {
        campaignId: ownProps.campaignId
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

interface AuthzProviderProps {
  adminPerms: boolean;
}

interface WrappedComponentProps
  extends RequiredComponentProps,
    AuthzProviderProps {
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
      queries: makeQueries(options.jobQueueNames.length > 0),
      mutations
    }),
    withProps((ownerProps: WrapperGraphqlProps & AuthzProviderProps) => {
      const {
        expandableBySuperVolunteers,
        expandAfterCampaignStarts,
        readinessName,
        jobQueueNames
      } = options;
      const { status, jobs, adminPerms, mutations } = ownerProps;
      const { deleteJob } = mutations;
      const { isStarted, readiness } = status.campaign;
      const pendingJob = jobs
        ? jobs.campaign.pendingJobs.find(job =>
            jobQueueNames.includes(job.jobType)
          )
        : undefined;

      const isExpandable =
        (expandAfterCampaignStarts || !isStarted) &&
        (expandableBySuperVolunteers || adminPerms);

      const sectionIsDone = readiness[readinessName];

      return { pendingJob, isExpandable, sectionIsDone, deleteJob };
    })
  )(props => {
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
      adminPerms,

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
        adminPerms={adminPerms}
        pendingJob={pendingJob}
        isExpandable={isExpandable}
        sectionIsDone={sectionIsDone}
        deleteJob={deleteJob}
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
