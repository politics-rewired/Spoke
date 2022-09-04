import type { Runner as Scheduler, ScheduleConfig } from "graphile-scheduler";
import { run as runScheduler } from "graphile-scheduler";
import type { LogFunctionFactory, Runner, TaskList } from "graphile-worker";
import { Logger, run } from "graphile-worker";

import { config } from "../config";
import { sleep } from "../lib";
import logger from "../logger";
import pgPool from "./db";
import {
  assignTexters,
  TASK_IDENTIFIER as assignTextersIdentifier
} from "./tasks/assign-texters";
import {
  exportCampaign,
  TASK_IDENTIFIER as exportCampaignIdentifier
} from "./tasks/export-campaign";
import {
  exportForVan,
  TASK_IDENTIFIER as exportForVanIdentifier
} from "./tasks/export-for-van";
import {
  filterLandlines,
  TASK_IDENTIFIER as filterLandlinesIdentifier
} from "./tasks/filter-landlines";
import handleAutoassignmentRequest from "./tasks/handle-autoassignment-request";
import handleDeliveryReport from "./tasks/handle-delivery-report";
import { taskList as ngpVanTaskList } from "./tasks/ngp-van";
import queueAutoSendInitials from "./tasks/queue-autosend-initials";
import {
  queueDailyNotifications,
  queuePendingNotifications,
  queuePeriodicNotifications
} from "./tasks/queue-pending-notifications";
import { releaseStaleReplies } from "./tasks/release-stale-replies";
import { resendMessage } from "./tasks/resend-message";
import { retryInteractionStep } from "./tasks/retry-interaction-step";
import {
  sendNotificationDigestForUser,
  sendNotificationEmail
} from "./tasks/send-notification-email";
import {
  syncCampaignContactToVAN,
  updateVanSyncStatuses
} from "./tasks/sync-campaign-contact-to-van";
import syncSlackTeamMembers from "./tasks/sync-slack-team-members";
import { trollPatrol, trollPatrolForOrganization } from "./tasks/troll-patrol";
import updateOrgMessageUsage from "./tasks/update-org-message-usage";
import { wrapProgressTask } from "./tasks/utils";

const logFactory: LogFunctionFactory = (scope) => (level, message, meta) =>
  logger.log({ level, message, ...meta, ...scope });

const graphileLogger = new Logger(logFactory);

let worker: Runner | undefined;
let workerSemaphore = false;

export const getWorker = async (attempt = 0): Promise<Runner> => {
  if (worker) return worker;

  const taskList: TaskList = {
    "handle-autoassignment-request": handleAutoassignmentRequest,
    "release-stale-replies": releaseStaleReplies,
    "handle-delivery-report": handleDeliveryReport,
    "troll-patrol": trollPatrol,
    "troll-patrol-for-org": trollPatrolForOrganization,
    "sync-slack-team-members": syncSlackTeamMembers,
    "van-sync-campaign-contact": syncCampaignContactToVAN,
    "update-van-sync-statuses": updateVanSyncStatuses,
    "update-org-message-usage": updateOrgMessageUsage,
    "resend-message": resendMessage,
    "retry-interaction-step": retryInteractionStep,
    "queue-pending-notifications": queuePendingNotifications,
    "queue-periodic-notifications": queuePeriodicNotifications,
    "queue-daily-notifications": queueDailyNotifications,
    "send-notification-email": sendNotificationEmail,
    "send-notification-digest": sendNotificationDigestForUser,
    "queue-autosend-initials": queueAutoSendInitials,
    [exportCampaignIdentifier]: wrapProgressTask(exportCampaign, {
      removeOnComplete: true
    }),
    [exportForVanIdentifier]: wrapProgressTask(exportForVan, {
      removeOnComplete: true
    }),
    [filterLandlinesIdentifier]: wrapProgressTask(filterLandlines, {
      removeOnComplete: false
    }),
    [assignTextersIdentifier]: wrapProgressTask(assignTexters, {
      removeOnComplete: true
    }),
    ...ngpVanTaskList
  };

  if (!workerSemaphore) {
    workerSemaphore = true;

    worker = await run({
      pgPool,
      taskList,
      concurrency: config.WORKER_CONCURRENCY,
      logger: graphileLogger,
      // Signals are handled by Terminus
      noHandleSignals: true,
      pollInterval: 1000
    });

    return worker;
  }

  // Someone beat us to the punch of initializing the runner
  if (attempt >= 20) throw new Error("getWorker() took too long to resolve");
  await sleep(100);
  return getWorker(attempt + 1);
};

let scheduler: Scheduler | undefined;
let schedulerSemaphore = false;

export const getScheduler = async (attempt = 0): Promise<Scheduler> => {
  if (scheduler) return scheduler;

  const schedules: ScheduleConfig[] = [
    {
      name: "release-stale-replies",
      taskIdentifier: "release-stale-replies",
      pattern: "*/5 * * * *",
      timeZone: config.TZ
    },

    {
      name: "update-van-sync-statuses",
      taskIdentifier: "update-van-sync-statuses",
      pattern: "* * * * *",
      timeZone: config.TZ
    },

    {
      name: "queue-pending-notifications",
      taskIdentifier: "queue-pending-notifications",
      pattern: "* * * * *",
      timeZone: config.TZ
    },

    {
      name: "queue-periodic-notifications",
      taskIdentifier: "queue-periodic-notifications",
      pattern: "0 9,13,16,20 * * *",
      timeZone: config.TZ
    },

    {
      name: "queue-daily-notifications",
      taskIdentifier: "queue-daily-notifications",
      pattern: "0 9 * * *",
      timeZone: config.TZ
    }
  ];

  if (config.ENABLE_AUTOSENDING) {
    schedules.push({
      name: "queue-autosend-initials",
      taskIdentifier: "queue-autosend-initials",
      pattern: "*/1 * * * *",
      timeZone: config.TZ
    });
  }

  if (config.ENABLE_MONTHLY_ORG_MESSAGE_LIMITS) {
    schedules.push({
      name: "update-org-message-usage",
      taskIdentifier: "update-org-message-usage",
      pattern: "*/5 * * * *",
      timeZone: config.TZ
    });
  }

  if (config.SLACK_SYNC_CHANNELS) {
    if (config.SLACK_TOKEN) {
      schedules.push({
        name: "sync-slack-team-members",
        taskIdentifier: "sync-slack-team-members",
        pattern: config.SLACK_SYNC_CHANNELS_CRONTAB,
        timeZone: config.TZ
      });
    } else {
      logger.error(
        "Could not enable slack channel sync. No SLACK_TOKEN present."
      );
    }
  }

  if (config.ENABLE_TROLLBOT) {
    const jobInterval = config.TROLL_ALERT_PERIOD_MINUTES - 1;
    schedules.push({
      name: "troll-patrol",
      taskIdentifier: "troll-patrol",
      pattern: `*/${jobInterval} * * * *`,
      timeZone: config.TZ
    });
  }

  if (!schedulerSemaphore) {
    schedulerSemaphore = true;

    scheduler = await runScheduler({
      pgPool,
      schedules,
      logger: graphileLogger as any
    });

    return scheduler;
  }

  // Someone beat us to the punch of initializing the runner
  if (attempt >= 20) throw new Error("getScheduler() took too long to resolve");
  await sleep(100);
  return getScheduler(attempt + 1);
};

export default getWorker;
