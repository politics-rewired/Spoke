import { r, JobRequest } from "../server/models";

export async function updateJob(job, percentComplete) {
  if (job.id) {
    await JobRequest.get(job.id).update({
      status: percentComplete,
      updated_at: new Date()
    });
  }
}

export async function getNextJob() {
  let nextJob = await r
    .knex("job_request")
    .where({ assigned: false })
    .orderBy("created_at")
    .first();
  if (nextJob) {
    const updateResults = await r
      .knex("job_request")
      .where({ id: nextJob.id })
      .update({ assigned: true });
    if (updateResults.replaced !== 1) {
      nextJob = null;
    }
  }
  return nextJob;
}
