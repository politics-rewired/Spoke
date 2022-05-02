import { LogFunctionFactory, Logger } from "graphile-worker";
import { Pool } from "pg";
import { loadYaml, PgComposeWorker, run } from "pg-compose";

import { config } from "../config";
import { sleep } from "../lib";
import logger from "../logger";
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
import fetchVANActivistCodes from "./tasks/fetch-van-activist-codes";
import fetchVANResultCodes from "./tasks/fetch-van-result-codes";
import fetchVANSurveyQuestions from "./tasks/fetch-van-survey-questions";
import {
  filterLandlines,
  TASK_IDENTIFIER as filterLandlinesIdentifier
} from "./tasks/filter-landlines";
import handleAutoassignmentRequest from "./tasks/handle-autoassignment-request";
import handleDeliveryReport from "./tasks/handle-delivery-report";
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

let worker: PgComposeWorker | undefined;
let workerSemaphore = false;

const poolConfig = {
  connectionString: config.DATABASE_URL,
  max: config.WORKER_MAX_POOL
};

const workerPool = new Pool(poolConfig);

export const getWorker = async (attempt = 0): Promise<PgComposeWorker> => {
  if (worker) return worker;

  const m = await loadYaml({ include: `${__dirname}/pg-compose/**/*.yaml` });

  m.taskList!["handle-autoassignment-request"] = handleAutoassignmentRequest;
  m.taskList!["release-stale-replies"] = releaseStaleReplies;
  m.taskList!["handle-delivery-report"] = handleDeliveryReport;
  m.taskList!["troll-patrol"] = trollPatrol;
  m.taskList!["troll-patrol-for-org"] = trollPatrolForOrganization;
  m.taskList!["sync-slack-team-members"] = syncSlackTeamMembers;
  m.taskList!["van-get-survey-questions"] = fetchVANSurveyQuestions;
  m.taskList!["van-get-activist-codes"] = fetchVANActivistCodes;
  m.taskList!["van-get-result-codes"] = fetchVANResultCodes;
  m.taskList!["van-sync-campaign-contact"] = syncCampaignContactToVAN;
  m.taskList!["update-van-sync-statuses"] = updateVanSyncStatuses;
  m.taskList!["update-org-message-usage"] = updateOrgMessageUsage;
  m.taskList!["resend-message"] = resendMessage;
  m.taskList!["retry-interaction-step"] = retryInteractionStep;
  m.taskList!["queue-pending-notifications"] = queuePendingNotifications;
  m.taskList!["queue-periodic-notifications"] = queuePeriodicNotifications;
  m.taskList!["queue-daily-notifications"] = queueDailyNotifications;
  m.taskList!["send-notification-email"] = sendNotificationEmail;
  m.taskList!["send-notification-digest"] = sendNotificationDigestForUser;
  m.taskList!["queue-autosend-initials"] = queueAutoSendInitials;
  m.taskList![exportCampaignIdentifier] = wrapProgressTask(exportCampaign, {
    removeOnComplete: true
  });
  m.taskList![exportForVanIdentifier] = wrapProgressTask(exportForVan, {
    removeOnComplete: true
  });
  m.taskList![filterLandlinesIdentifier] = wrapProgressTask(filterLandlines, {
    removeOnComplete: false
  });
  m.taskList![assignTextersIdentifier] = wrapProgressTask(assignTexters, {
    removeOnComplete: true
  });

  m.cronJobs!.push({
    name: "release-stale-replies",
    task_name: "release-stale-replies",
    pattern: "*/5 * * * *",
    time_zone: config.TZ
  });

  m.cronJobs!.push({
    name: "update-van-sync-statuses",
    task_name: "update-van-sync-statuses",
    pattern: "* * * * *",
    time_zone: config.TZ
  });

  m.cronJobs!.push({
    name: "queue-pending-notifications",
    task_name: "queue-pending-notifications",
    pattern: "* * * * *",
    time_zone: config.TZ
  });

  m.cronJobs!.push({
    name: "queue-periodic-notifications",
    task_name: "queue-periodic-notifications",
    pattern: "0 9,13,16,20 * * *",
    time_zone: config.TZ
  });

  m.cronJobs!.push({
    name: "queue-daily-notifications",
    task_name: "queue-daily-notifications",
    pattern: "0 9 * * *",
    time_zone: config.TZ
  });

  if (config.ENABLE_AUTOSENDING) {
    m.cronJobs!.push({
      name: "queue-autosend-initials",
      task_name: "queue-autosend-initials",
      pattern: "*/1 * * * *",
      time_zone: config.TZ
    });
  }

  if (config.ENABLE_MONTHLY_ORG_MESSAGE_LIMITS) {
    m.cronJobs!.push({
      name: "update-org-message-usage",
      task_name: "update-org-message-usage",
      pattern: "*/5 * * * *",
      time_zone: config.TZ
    });
  }

  if (config.SLACK_SYNC_CHANNELS) {
    if (config.SLACK_TOKEN) {
      m.cronJobs!.push({
        name: "sync-slack-team-members",
        task_name: "sync-slack-team-members",
        pattern: config.SLACK_SYNC_CHANNELS_CRONTAB,
        time_zone: config.TZ
      });
    } else {
      logger.error(
        "Could not enable slack channel sync. No SLACK_TOKEN present."
      );
    }
  }

  if (config.ENABLE_TROLLBOT) {
    const jobInterval = config.TROLL_ALERT_PERIOD_MINUTES - 1;
    m.cronJobs!.push({
      name: "troll-patrol",
      task_name: "troll-patrol",
      pattern: `*/${jobInterval} * * * *`,
      time_zone: config.TZ
    });
  }

  if (!workerSemaphore) {
    workerSemaphore = true;

    worker = await run(m, {
      pgPool: workerPool,
      encryptionSecret: config.SESSION_SECRET,
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

export default getWorker;
