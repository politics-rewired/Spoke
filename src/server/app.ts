import passport from "@passport-next/passport";
import bodyParser from "body-parser";
import connectDatadog from "connect-datadog-graphql";
import cookieSession from "cookie-session";
import express from "express";
import basicAuth from "express-basic-auth";
import StatsD from "hot-shots";

import { config } from "../config";
import requestLogging from "../lib/request-logging";
import logger from "../logger";
import { fulfillPendingRequestFor } from "./api/assignment";
import appRenderer from "./middleware/app-renderer";
import {
  assembleRouter,
  authRouter,
  graphqlRouter,
  nexmoRouter,
  previewRouter,
  twilioRouter,
  utilsRouter
} from "./routes";
import { errToObj } from "./utils";

const {
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
    dogstatsd: new StatsD({
      host: config.DD_AGENT_HOST,
      port: config.DD_DOGSTATSD_PORT,
      errorHandler: (err: Error) =>
        logger.error("connect-datadog encountered error: ", errToObj(err))
    }),
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

// Custom error handling
const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  logger.warn("Unhandled express error: ", {
    error: errToObj(err),
    req
  });
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: true });
};
app.use(errorHandler);

export default app;
