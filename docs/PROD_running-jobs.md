# Spoke Jobs

Our fork of Spoke manages jobs in two ways:

1.  The home-rolled database-backed job queue used in the Move On fork
1.  [Graphile Worker](https://github.com/graphile/worker) - a battle-tested database-backed job queue with a large developer community

We are working on migrating all jobs to Graphile Worker for stability.

# Graphile Worker Job Queue

There is currently no distinction between an Express API server process and a Graphile Worker process. Each server process runs both. This causes some problems with database connection pool exhaustion.

We plan on adding an envvar control for this: `MODE`. `MODE` will take values of `SERVER`, `WORKER`, or `DUAL`. `SERVER` and `WORKER` would each run dedicated Express or Graphile Worker processes, respectively, while `DUAL` will run both (the current behavior).

# Move On Job Queue

## Running Jobs in Production

There are two modes possible in the code base driven by an environment variable
(and what processes your setup/run) called `JOBS_SAME_PROCESS`. If that variable
is set then dispatched jobs like processing uploaded contacts, and sending text
messages out are run on the same process as the actual web application.

There are advantages and disadvantages to each model:

### JOBS_SAME_PROCESS

- Simpler dispatch, application runs in a single 'node' process loop
- Can be run on 'serverless' platforms like AWS Lambda (with one lambda)
- When in development mode the log loop of the job processor processes doesn't

### Separate Processes

- If you are using a texting backend that rate-limits API calls (Twilio does not)
  then it's easier to make sure the rate-limit is observed with the separate process
- On a big server-deployment job segfaults (should be impossible, but...) will more
  isolated
