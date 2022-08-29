import type { JobHelpers, TaskSpec } from "graphile-worker";

import type { JobRequestRecord } from "../api/types";
import { r } from "../models";

const addGraphileJob = async (
  identifier: string,
  payload: any,
  taskSpec: TaskSpec
) => {
  const columns = [];
  const bindings = [];
  if (taskSpec.queueName) {
    columns.push("queue_name");
    bindings.push(taskSpec.queueName);
  }
  if (taskSpec.runAt) {
    columns.push("run_at");
    bindings.push(taskSpec.runAt);
  }
  if (taskSpec.priority) {
    columns.push("priority");
    bindings.push(taskSpec.priority);
  }
  if (taskSpec.maxAttempts) {
    columns.push("max_attempts");
    bindings.push(taskSpec.maxAttempts);
  }
  if (taskSpec.jobKey) {
    columns.push("key");
    bindings.push(taskSpec.jobKey);
  }

  const columnsVals = columns.map((colName) => `, ${colName}`).join("");
  const bindingPlaceholders = columns.map((_) => ", ?").join("");

  await r.knex.raw(
    `
      insert into graphile_worker.jobs (task_identifier, payload${columnsVals})
      values (?, ?${bindingPlaceholders})
    `,
    [identifier, JSON.stringify(payload), ...bindings]
  );
};

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
    initialResult = {},
    context = {}
  } = options;
  const { campaignId } = payload;
  const { queueName = `${campaignId}:${identifier}` } = taskSpec;

  const [jobResult] = await r
    .knex<JobRequestRecord>("job_request")
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

  await addGraphileJob(identifier, wrappedPayload, innerSpec);

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

  const updateStatus = async (status: number) => {
    await r.knex("job_request").update({ status }).where({ id: jobId });
  };

  const updateResult = async (result: Record<string, unknown>) => {
    await r
      .knex("job_request")
      .update({ result_message: result })
      .where({ id: jobId });
  };

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
  } catch (err: any) {
    const { attempts, max_attempts } = helpers.job;
    if (attempts === max_attempts) {
      // "Complete" graphile job by recording error on the final attempt
      return updateResult({ error: err.message });
    }
    // throw error to trigger graphile retry
    throw err;
  }
};
