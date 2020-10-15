import { Task } from "graphile-worker/dist/interfaces";
import { getWorker } from "../worker";
import { r } from "../models";
import logger from "../../../src/logger";

export const addProgressJob = async (
  identifier: string,
  payload: any,
  initialResult: any = {},
  context: any = {}
) => {
  const { jobRequestRecord, requester } = payload;
  const { campaign_id, queue_name, locks_queue, assigned } = jobRequestRecord;
  const jobPayload = { campaign_id, requester };

  const [jobResult] = await r
    .knex("job_request")
    .insert({
      job_type: identifier,
      status: 0,
      campaign_id,
      queue_name,
      locks_queue,
      assigned,
      payload: JSON.stringify(jobPayload),
      result_message: JSON.stringify(initialResult)
    })
    .returning("*");

  const wrappedPayload = { ...payload, _jobRequestId: jobResult.id };

  const worker = await getWorker();
  worker.addJob(identifier, wrappedPayload);
  return jobResult;
};

interface ProgressTaskPayload {
  _jobRequestId: string;
}

interface ProgressTaskOptions {
  removeOnComplete: boolean;
}

export const wrappedProgressTask = (
  task: Task,
  options: ProgressTaskOptions
) => async (payload: ProgressTaskPayload, helpers: any) => {
  const jobId = payload._jobRequestId;
  const jobRequest = await r
    .knex("job_request")
    .where({ id: jobId })
    .first();
  const updateStatus = async (status: number) =>
    await r
      .knex("job_request")
      .update({ status })
      .where({ id: jobId });
  const updateResult = async (result: any) =>
    await r
      .knex("job_request")
      .update({ result_message: result })
      .where({ id: jobId });
  const progressHelpers = {
    ...helpers,
    jobRequest,
    updateStatus,
    updateResult
  };

  try {
    await task(payload, progressHelpers);
    logger.info("wrappedProgress runs payload", payload);
    if (options.removeOnComplete) {
      await r
        .knex("job_request")
        .where({ id: jobId })
        .del();
    }
  } catch (err) {
    const { attempts, maxAttempts } = helpers.job;
    if (attempts === maxAttempts) {
      // "Complete" graphile job by recording error on the final attempt
      return updateResult({ error: err.message });
    }
    // throw error to trigger graphile retry
    throw err;
  }
};
