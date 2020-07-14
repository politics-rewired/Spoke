import { config } from "../config";
import logger from "../logger";
import bodyParser from "body-parser";
import express from "express";
import http from "http";
import { createTerminus } from "@godaddy/terminus";
import appRenderer from "./middleware/app-renderer";
import passport from "passport";
import cookieSession from "cookie-session";
import { setupUserNotificationObservers } from "./notifications";
import basicAuth from "express-basic-auth";
import { fulfillPendingRequestFor } from "./api/assignment";
import requestLogging from "../lib/request-logging";
import { checkForBadDeliverability } from "./api/lib/alerts";
import cron from "node-cron";
import hotShots from "hot-shots";
import connectDatadog from "connect-datadog-graphql";
import {
  authRouter,
  graphqlRouter,
  nexmoRouter,
  twilioRouter,
  assembleRouter,
  utilsRouter,
  previewRouter,
  integrationsRouter
} from "./routes";
import { r } from "./models";
import { getWorker } from "./worker";

process.on("uncaughtException", ex => {
  logger.error("uncaughtException: ", ex);
  process.exit(1);
});

process.on("unhandledRejection", err => {
  logger.error("unhandledRejection: ", err);
  process.exit(1);
});

cron.schedule("0 */1 * * *", checkForBadDeliverability);

setupUserNotificationObservers();

const {
  DEV_APP_PORT,
  PORT,
  PUBLIC_DIR,
  SESSION_SECRET,
  ASSIGNMENT_USERNAME,
  ASSIGNMENT_PASSWORD
} = config;

const app = express();

if (config.LOG_LEVEL === "verbose" || config.LOG_LEVEL === "debug") {
  app.use(requestLogging);
}

// Send version to client
if (config.SPOKE_VERSION) {
  app.use((_req, res, next) => {
    res.setHeader("x-spoke-version", config.SPOKE_VERSION);
    next();
  });
}

app.enable("trust proxy"); // Don't rate limit heroku
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      maxAge: null
    },
    secret: SESSION_SECRET
  })
);
app.use(passport.initialize());
app.use(passport.session());

if (PUBLIC_DIR) {
  app.use(express.static(PUBLIC_DIR, { maxAge: "180 days" }));
}

if (config.DD_AGENT_HOST && config.DD_DOGSTATSD_PORT) {
  const datadogOptions = {
    dogstatsd: new hotShots.StatsD(
      config.DD_AGENT_HOST,
      config.DD_DOGSTATSD_PORT
    ),
    path: true,
    method: false,
    response_code: true,
    graphql_paths: ["/graphql"],
    tags: config.DD_TAGS.split(",")
  };

  if (config.CLIENT_NAME) {
    datadogOptions.tags.push(`client:${config.CLIENT_NAME}`);
  }

  app.use(connectDatadog(datadogOptions));
}

app.use(authRouter);
app.use(graphqlRouter);
app.use(nexmoRouter);
app.use(twilioRouter);
app.use(assembleRouter);
app.use(utilsRouter);
app.use(previewRouter);
app.use("/integrations", integrationsRouter);

app.post(
  "/autoassign",
  basicAuth({
    users: {
      [ASSIGNMENT_USERNAME]: ASSIGNMENT_PASSWORD
    }
  }),
  async (req, res) => {
    if (!req.body.slack_id)
      return res
        .status(400)
        .json({ error: "Missing parameter `slack_id` in POST body." });
    if (!req.body.count)
      return res
        .status(400)
        .json({ error: "Missing parameter `count` in POST body." });

    try {
      const numberAssigned = await fulfillPendingRequestFor(req.body.slack_id);
      return res.json({ numberAssigned });
    } catch (err) {
      logger.error("Error handling autoassignment request: ", err);
      return err.isFatal
        ? res.status(500).json({ error: err.message })
        : res.status(200).json({
            numberAssigned: 0,
            info: err.message
          });
    }
  }
);

// This middleware should be last. Return the React app only if no other route is hit.
app.use(appRenderer);

const server = http.createServer(app);

// Ensure database is reachable
const onHealthCheck = async () =>
  r.knex.raw("select 1;").then(() => ({ status: "healthy" }));

const waitMs = config.SHUTDOWN_GRACE_PERIOD;
const beforeShutdown = () => {
  logger.info(
    `Received kill signal, waiting ${waitMs}ms before shutting down...`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info("Done waiting");
      resolve();
    }, waitMs);
  });
};

const teardownKnex = async () => {
  logger.info("Starting cleanup of Postgres pools.");
  const readerPromise = !!config.DATABASE_READER_URL
    ? r.reader.destroy().then(() => logger.info("  - tore down Knex reader"))
    : Promise.resolve();
  return Promise.all([
    r.knex.destroy().then(() => logger.info("  - tore down Knex writer")),
    readerPromise
  ]);
};

const teardownGraphile = async () =>
  getWorker()
    .then(worker => worker.stop())
    .then(() => logger.info("  - tore down Graphile runner"));

const onSignal = () => {
  return Promise.all([teardownKnex(), teardownGraphile()]);
};

const onShutdown = () => {
  logger.info("Cleanup finished, server is shutting down.");
};

createTerminus(server, {
  signals: ["SIGTERM", "SIGINT"],
  healthChecks: { "/health": onHealthCheck },
  onSignal,
  beforeShutdown,
  onShutdown,
  logger: (msg, err) => {
    if (err) {
      logger.error(`${msg}: `, err);
    } else {
      logger.info(msg);
    }
  }
});

getWorker().then(() => {
  // Heroku requires you to use process.env.PORT
  const port = DEV_APP_PORT || PORT;
  server.listen(port, () => {
    logger.info(`Node app is running on port ${port}`);
  });
});

// Used by lambda handler
export default app;
