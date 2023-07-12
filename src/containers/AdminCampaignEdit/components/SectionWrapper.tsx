import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import { makeStyles } from "@material-ui/core";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import CircularProgress from "@material-ui/core/CircularProgress";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import CancelIcon from "@material-ui/icons/Cancel";
import DoneIcon from "@material-ui/icons/Done";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import WarningIcon from "@material-ui/icons/Warning";
import clsx from "clsx";
import isNil from "lodash/isNil";
import React from "react";
import { compose, withProps } from "recompose";

import { camelCase, dataTest } from "../../../lib/attributes";
import assemblePalette from "../../../styles/assemble-palette";
import type { MuiThemeProviderProps } from "../../../styles/types";
import type { AuthzContextType } from "../../AuthzProvider";
import { withAuthzContext } from "../../AuthzProvider";
import { loadData } from "../../hoc/with-operations";
import type { CampaignReadinessType } from "../types";

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

const useStyles = makeStyles((theme) => ({
  card: {
    marginTop: theme.spacing(1)
  },
  cardHeaderWrapper: {
    border: "1px solid",
    borderTopRightRadius: theme.shape.borderRadius,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderColor: theme.palette.grey[500]
  },
  cardHeader: {
    backgroundColor: theme.palette.grey[50],
    cursor: "pointer"
  },
  cardTitle: {
    width: "100%"
  },
  saving: {
    backgroundColor: theme.palette.grey[400]
  },
  active: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.getContrastText(theme.palette.primary.main)
  },
  unexpandable: {
    backgroundColor: assemblePalette.common.lightGrey,
    color: theme.palette.text.primary,
    cursor: "default"
  },
  done: {
    backgroundColor: theme.palette.getContrastText(theme.palette.primary.main),
    color: theme.palette.primary.main
  },
  notDone: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.text.primary
  },
  cardAvatar: {
    backgroundColor: assemblePalette.common.lightGrey,
    width: theme.spacing(4),
    height: theme.spacing(4)
  },
  cardAvatarEmpty: {
    backgroundColor: "transparent"
  },
  doneIcon: {
    color: theme.palette.success.main
  },
  warningIcon: {
    color: theme.palette.warning.main
  },
  expand: {
    transform: "rotate(0deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: "rotate(180deg)",
    color: theme.palette.getContrastText(theme.palette.primary.main)
  },
  expandClosedText: {
    color: theme.palette.primary.main
  }
}));

const unpackStatus = (percentComplete: number) => {
  const progressPercent =
    percentComplete > 100 ? percentComplete - 100 : percentComplete;
  const progressMessage =
    percentComplete > 100
      ? `Filtering out landlines. ${progressPercent}% complete`
      : `Uploading. ${progressPercent}% complete`;

  return { progressPercent, progressMessage };
};

const unpackJob = (job?: PendingJobType | null) => ({
  jobId: job ? job.id : null,
  savePercent: job ? job.status : 0,
  jobMessage: job ? job.resultMessage : "",
  isSaving: !isNil(job) && (!job.resultMessage || job.resultMessage === "{}")
});

export const SectionWrapper: React.FC<WrapperProps> = (props) => {
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

  const classes = useStyles();

  const { jobId, savePercent, jobMessage, isSaving } = unpackJob(pendingJob);
  const { progressMessage, progressPercent } = unpackStatus(savePercent);

  const expandable = !isSaving && isExpandable;
  const expanded = active && expandable;

  let avatar = (
    <Avatar className={clsx(classes.cardAvatar, classes.cardAvatarEmpty)}>
      &nbsp;
    </Avatar>
  );
  const classNames: string[] = [classes.cardHeader];
  const cardHeaderStyle: React.CSSProperties = {};

  if (isSaving) {
    avatar = (
      <CircularProgress
        className={clsx(classes.cardAvatar, classes.cardAvatarEmpty)}
      />
    );
    classNames.push(classes.saving);
    cardHeaderStyle.width = `${progressPercent}%`;
  } else if (active && expandable) {
    classNames.push(classes.active);
  } else if (!expandable) {
    classNames.push(classes.unexpandable);
  } else if (sectionIsDone) {
    avatar = (
      <Avatar className={classes.cardAvatar}>
        <DoneIcon className={classes.doneIcon} />
      </Avatar>
    );
    classNames.push(classes.done);
  } else if (!sectionIsDone) {
    avatar = (
      <Avatar className={classes.cardAvatar}>
        <WarningIcon className={classes.warningIcon} />
      </Avatar>
    );
    classNames.push(classes.notDone);
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
    } catch (err: any) {
      onError(err.message);
    }
  };

  return (
    <Card {...dataTest(camelCase(title))} className={classes.card}>
      <div className={clsx({ [classes.cardHeaderWrapper]: isSaving })}>
        <CardHeader
          title={title}
          titleTypographyProps={{ variant: "body1" }}
          className={clsx(...classNames)}
          style={cardHeaderStyle}
          avatar={avatar}
          action={
            expandable && (
              <IconButton
                className={clsx(classes.expand, {
                  [classes.expandOpen]: expanded
                })}
              >
                <ExpandMoreIcon
                  className={clsx({ [classes.expandClosedText]: !expanded })}
                />
              </IconButton>
            )
          }
          onClick={() => onExpandChange(!expanded)}
        />
      </div>
      <Collapse in={expanded}>
        <CardContent>{children}</CardContent>
      </Collapse>
      {isSaving && isAdmin && (
        <CardActions>
          <div>Current Status: {progressMessage}</div>
          {jobMessage && jobMessage !== "{}" && (
            <div>Message: {jobMessage}</div>
          )}
          <Button
            variant="contained"
            endIcon={<CancelIcon />}
            onClick={handleDiscardJob}
          >
            Discard Job
          </Button>
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
            messagingService
            textingHours
            integration
            contacts
            autoassign
            cannedResponses
            interactions
            texters
            campaignGroups
            campaignVariables
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
