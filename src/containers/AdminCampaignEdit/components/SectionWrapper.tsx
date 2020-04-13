import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
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

const extractStageAndStatus = (percentComplete: number) => {
  const progressPercent =
    percentComplete > 100 ? percentComplete - 100 : percentComplete;
  const progressMessage =
    percentComplete > 100
      ? `Filtering out landlines. ${progressPercent}% complete`
      : `Uploading. ${progressPercent}% complete`;

  return { progressPercent, progressMessage };
};

export interface WrapperOuterProps {
  campaignId: string;
  active: boolean;
  onExpandChange(expanded: boolean): void;
  onError(message: string): void;
}

export interface SectionOptions {
  title: string;
  readinessName: keyof CampaignReadinessType;
  jobQueueNames: string[];
  expandAfterCampaignStarts: boolean;
  expandableBySuperVolunteers: boolean;
}

interface WrapperHocProps {
  adminPerms: boolean;
  // GraphQL
  data: {
    campaign: {
      id: string;
      isStarted: boolean;
      pendingJobs: {
        id: string;
        jobType: string;
        status: number;
        resultMessage: string;
      }[];
      readiness: CampaignReadinessType;
    };
  };
  mutations: {
    deleteJob(jobId: string): ApolloQueryResult<{ id: string }>;
  };
}

interface WrapperInnerProps
  extends WrapperOuterProps,
    WrapperHocProps,
    SectionOptions {}

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

const SectionWrapper: React.SFC<WrapperInnerProps> = props => {
  const {
    title,
    readinessName,
    active,
    jobQueueNames,
    expandAfterCampaignStarts,
    expandableBySuperVolunteers,
    children,
    onExpandChange,

    // HOC
    adminPerms,
    data,
    mutations: { deleteJob }
  } = props;
  const { isStarted, pendingJobs, readiness } = data.campaign;
  const sectionIsDone = readiness[readinessName];

  // Save state
  const pendingJob = pendingJobs.find(job =>
    jobQueueNames.includes(job.jobType)
  );
  const jobId = pendingJob ? pendingJob.id : null;
  const savePercent = pendingJob ? pendingJob.status : 0;
  const jobMessage = pendingJob ? pendingJob.resultMessage : "";
  const isSaving = pendingJob !== undefined && !jobMessage;

  const { progressPercent, progressMessage } = extractStageAndStatus(
    savePercent
  );

  const isExpandable =
    (expandAfterCampaignStarts || !isStarted) &&
    (expandableBySuperVolunteers || adminPerms);

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
      props.onError(err.message);
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

const queries = {
  data: {
    query: gql`
      query getCampaignJobs($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          isStarted
          pendingJobs {
            id
            jobType
            status
            resultMessage
          }
          readiness {
            id
            basics
          }
        }
      }
    `,
    options: (ownProps: WrapperInnerProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      },
      pollInterval: 60 * 1000
    })
  }
};

const mutations = {
  deleteJob: (ownProps: WrapperInnerProps) => (jobId: string) => ({
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
    }
  })
};

const SectionWrapperComplete = compose<WrapperInnerProps, WrapperOuterProps>(
  withAuthzContext,
  loadData({
    queries,
    mutations
  })
)(SectionWrapper);

export interface RequiredComponentProps {
  campaignId: string;
  isNew: boolean;
  saveLabel: string;
  onError(message: string): void;
}

export const asSection = <T extends RequiredComponentProps>(
  options: SectionOptions
) => (Component: React.ComponentType<T>) => {
  return (props: T & WrapperOuterProps) => {
    const { campaignId, active, onExpandChange, onError } = props;
    return (
      <SectionWrapperComplete
        campaignId={campaignId}
        active={active}
        onExpandChange={onExpandChange}
        onError={onError}
        {...options}
      >
        <Component {...props} />
      </SectionWrapperComplete>
    );
  };
};
