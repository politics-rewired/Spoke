import { JobHelpers, TaskSpec } from "graphile-worker";

import { JobRequestRecord } from "../api/types";
import { r } from "../models";
import { getWorker } from "../worker";

export interface ProgressJobPayload {
  campaignId: number;
}

export interface ProgressJobOptions<P extends ProgressJobPayload> {
  identifier: string;
  payload: P;
  taskSpec?: Omit<TaskSpec, "jobKey">;
  initialResult?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export const addProgressJob = async <P extends ProgressJobPayload>(
  options: ProgressJobOptions<P>
) => {
  const {
    identifier,
    taskSpec = {},
    payload,
    initialResult,
    context
  } = options;
  const { campaignId } = payload;
  const { queueName = `${campaignId}:${identifier}` } = taskSpec;

  const [jobResult]: [JobRequestRecord] = await r
    .knex("job_request")
    .insert({
      job_type: identifier,
      status: 0,
      campaign_id: campaignId,
      queue_name: queueName,
      payload: JSON.stringify(context),
      result_message: JSON.stringify(initialResult)
    })
    .returning("*");

  const wrappedPayload = { ...payload, _jobRequestId: jobResult.id };

  const innerSpec: TaskSpec = {
    ...taskSpec,
    jobKey: `${jobResult.id}`
  };

  const worker = await getWorker();
  worker.addJob(identifier, wrappedPayload, innerSpec);
  return jobResult;
};

export interface ProgressTaskPayload {
  _jobRequestId: string;
}

export interface ProgressTaskHelpers extends JobHelpers {
  jobRequest: JobRequestRecord;
  updateStatus(status: number): Promise<void>;
  updateResult(result: Record<string, unknown>): Promise<void>;
}

export type ProgressTask<P = unknown> = (
  payload: P,
  helpers: ProgressTaskHelpers
) => void | Promise<void>;

export interface ProgressTaskOptions {
  removeOnComplete: boolean;
}

export const wrapProgressTask = <P extends { [key: string]: any }>(
  task: ProgressTask<P>,
  options: ProgressTaskOptions
) => async (payload: ProgressTaskPayload & P, helpers: JobHelpers) => {
  const { _jobRequestId: jobId } = payload;

  const jobRequest = await r.knex("job_request").where({ id: jobId }).first();

  const updateStatus = async (status: number) =>
    r.knex("job_request").update({ status }).where({ id: jobId });

  const updateResult = async (result: Record<string, unknown>) =>
    r
      .knex("job_request")
      .update({ result_message: result })
      .where({ id: jobId });

  const progressHelpers: ProgressTaskHelpers = {
    ...helpers,
    jobRequest,
    updateStatus,
    updateResult
  };

  try {
    await task(payload, progressHelpers);
    helpers.logger.info("wrappedProgress runs payload", payload);
    if (options.removeOnComplete) {
      await r.knex("job_request").where({ id: jobId }).del();
    }
  } catch (err) {
    const { attempts, max_attempts } = helpers.job;
    if (attempts === max_attempts) {
      // "Complete" graphile job by recording error on the final attempt
      return updateResult({ error: err.message });
    }
    // throw error to trigger graphile retry
    throw err;
  }
};
