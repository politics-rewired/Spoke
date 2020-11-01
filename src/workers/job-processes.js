import { config } from "../config";
import { sleep } from "../lib/utils";
import logger from "../logger";
import { r } from "../server/models";
import { setupUserNotificationObservers } from "../server/notifications";
import {
  assignTexters,
  clearOldJobs,
  fixOrgless,
  handleIncomingMessageParts,
  loadContactsFromDataWarehouse,
  loadContactsFromDataWarehouseFragment,
  processSqsMessages,
  sendMessages,
  uploadContacts
} from "./jobs";
import { getNextJob } from "./lib";

/* Two process models are supported in this file.
   The main in both cases is to process jobs and send/receive messages
   on separate loop(s) from the web server.
   * job processing (e.g. contact loading) shouldn't delay text message processing

   The two process models:
   * Run the 'scripts' in dev-tools/Procfile.dev
 */

const jobMap = {
  upload_contacts: uploadContacts,
  upload_contacts_sql: loadContactsFromDataWarehouse,
  assign_texters: assignTexters
};

export async function processJobs() {
  setupUserNotificationObservers();
  logger.info("Running processJobs");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await sleep(1000);
      const job = await getNextJob();
      if (job) {
        await jobMap[job.job_type](job);
      }

      const twoMinutesAgo = new Date(new Date() - 1000 * 60 * 2);
      // clear out stuck jobs
      await clearOldJobs(twoMinutesAgo);
    } catch (ex) {
      logger.error("Error processing jobs: ", ex);
    }
  }
}

export async function checkMessageQueue() {
  if (!config.TWILIO_SQS_QUEUE_URL) {
    return;
  }

  logger.info("checking if messages are in message queue");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await sleep(10000);
      processSqsMessages();
    } catch (ex) {
      logger.error("Error checking message queue: ", ex);
    }
  }
}

const messageSenderCreator = (subQuery, defaultStatus) => {
  return async event => {
    logger.info("Running a message sender");
    setupUserNotificationObservers();
    let delay = 1100;
    if (event && event.delay) {
      delay = parseInt(event.delay, 10);
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await sleep(delay);
        await sendMessages(subQuery, defaultStatus);
      } catch (ex) {
        logger.error("Error sending messages from messageSender: ", ex);
      }
    }
  };
};

export const messageSender01 = messageSenderCreator(mQuery => {
  return mQuery.where(
    r.knex.raw("(contact_number LIKE '%0' OR contact_number LIKE '%1')")
  );
});

export const messageSender234 = messageSenderCreator(mQuery => {
  return mQuery.where(
    r.knex.raw(
      "(contact_number LIKE '%2' OR contact_number LIKE '%3' or contact_number LIKE '%4')"
    )
  );
});

export const messageSender56 = messageSenderCreator(mQuery => {
  return mQuery.where(
    r.knex.raw("(contact_number LIKE '%5' OR contact_number LIKE '%6')")
  );
});

export const messageSender789 = messageSenderCreator(mQuery => {
  return mQuery.where(
    r.knex.raw(
      "(contact_number LIKE '%7' OR contact_number LIKE '%8' or contact_number LIKE '%9')"
    )
  );
});

export const failedMessageSender = messageSenderCreator(mQuery => {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  const fiveMinutesAgo = new Date(new Date() - 1000 * 60 * 5);
  return mQuery.where("created_at", ">", fiveMinutesAgo);
}, "SENDING");

export const failedDayMessageSender = messageSenderCreator(mQuery => {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  const oneDayAgo = new Date(new Date() - 1000 * 60 * 60 * 24);
  return mQuery.where("created_at", ">", oneDayAgo);
}, "SENDING");

export async function handleIncomingMessages() {
  setupUserNotificationObservers();
  if (config.DEBUG_INCOMING_MESSAGES) {
    logger.debug("Running handleIncomingMessages");
  }
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (config.DEBUG_SCALING) {
        logger.debug("entering handleIncomingMessages. round: ", (i += 1));
      }
      const countPendingMessagePart = await r.parseCount(
        r.reader("pending_message_part").count()
      );
      if (config.DEBUG_SCALING) {
        logger.debug(
          `counting handleIncomingMessages. count: ${countPendingMessagePart}`
        );
      }
      await sleep(500);
      if (countPendingMessagePart > 0) {
        if (config.DEBUG_SCALING) {
          logger.debug("running handleIncomingMessages");
        }
        await handleIncomingMessageParts();
      }
    } catch (ex) {
      logger.error("Error at handleIncomingMessages: ", ex);
    }
  }
}

export async function runDatabaseMigrations(event, dispatcher, eventCallback) {
  r.knex.migrate.latest();
  if (eventCallback) {
    eventCallback(null, "completed migrations");
  }
}

export async function loadContactsFromDataWarehouseFragmentJob(
  event,
  dispatcher,
  eventCallback
) {
  const eventAsJob = event;
  logger.info("LAMBDA INVOCATION job-processes", event);
  try {
    const rv = await loadContactsFromDataWarehouseFragment(eventAsJob);
    if (eventCallback) {
      eventCallback(null, rv);
    }
  } catch (err) {
    if (eventCallback) {
      eventCallback(err, null);
    }
  }
}

const processMap = {
  processJobs,
  messageSender01,
  messageSender234,
  messageSender56,
  messageSender789,
  handleIncomingMessages,
  fixOrgless
};

// if config.JOBS_SAME_PROCESS then we don't need to run
// the others and messageSender should just pick up the stragglers
const syncProcessMap = {
  // 'failedMessageSender': failedMessageSender, //see method for danger
  handleIncomingMessages,
  checkMessageQueue,
  fixOrgless,
  clearOldJobs
};

export async function dispatchProcesses(event, _dispatcher, _eventCallback) {
  const toDispatch =
    event.processes || (config.JOBS_SAME_PROCESS ? syncProcessMap : processMap);
  for (const p in toDispatch) {
    if (p in processMap) {
      // / not using dispatcher, but another interesting model would be
      // / to dispatch processes to other lambda invocations
      // dispatcher({'command': p})
      logger.info("process", p);
      toDispatch[p]().then();
    }
  }
}
