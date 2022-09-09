import type { Task } from "graphile-worker";

export const TASK_IDENTIFIER = "update-van-sync-statuses";

export const updateVanSyncStatuses: Task = async (_payload, helpers) => {
  await helpers.query(
    `select * from public.update_van_sync_job_request_status()`
  );
};

export default updateVanSyncStatuses;
