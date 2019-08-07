import "babel-polyfill";
import bodyParser from "body-parser";
import express from "express";
import appRenderer from "./middleware/app-renderer";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
import { resolvers } from "./api/schema";
import { schema } from "../api/schema";
import { accessRequired } from "./api/errors";
import mocks from "./api/mocks";
import { createLoaders, r } from "./models";
import passport from "passport";
import cookieSession from "cookie-session";
import authStrategies from "./auth-passport";
import wrap from "./wrap";
import { log } from "../lib";
import nexmo from "./api/lib/nexmo";
import twilio from "./api/lib/twilio";
import { setupUserNotificationObservers } from "./notifications";
import { TwimlResponse } from "twilio";
import basicAuth from "express-basic-auth";
import { fulfillPendingRequestFor } from "./api/assignment";
import googleLibPhoneNumber from "google-libphonenumber";
import requestLogging from "../lib/request-logging";
import { checkForBadDeliverability } from "./api/lib/alerts";
import cron from "node-cron";
import connectDatadog from "connect-datadog-graphql";
import { config } from "../config";

cron.schedule("0 */1 * * *", checkForBadDeliverability);

const phoneUtil = googleLibPhoneNumber.PhoneNumberUtil.getInstance();
const PNF = googleLibPhoneNumber.PhoneNumberFormat;

process.on("uncaughtException", ex => {
  log.error(ex);
  process.exit(1);
});

const {
  NODE_ENV,
  PASSPORT_STRATEGY,
  DEV_APP_PORT,
  PORT,
  PUBLIC_DIR,
  SESSION_SECRET,
  ASSIGNMENT_USERNAME,
  ASSIGNMENT_PASSWORD,
  CONTACT_REMOVAL_SECRET
} = config;

const DEBUG = NODE_ENV === "development";
// Heroku requires you to use process.env.PORT
const port = DEV_APP_PORT || PORT;
const loginStrategy = PASSPORT_STRATEGY || global.PASSPORT_STRATEGY || "auth0";

setupUserNotificationObservers();

const app = express();

// app.use(requestLogging);

// Don't rate limit heroku
app.enable("trust proxy");

if (PUBLIC_DIR) {
  app.use(express.static(PUBLIC_DIR, { maxAge: "180 days" }));
}

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

if (config.DD_AGENT_HOST && config.DD_DOGSTATSD_PORT) {
  const datadogOptions = {
    path: true,
    method: false,
    response_code: true,
    graphql_paths: "/graphql"
  };

  if (config.CLIENT_NAME) {
    datadogOptions.tags = [`client:${config.CLIENT_NAME}`];
  }

  app.use(connectDatadog(datadogOptions));
}

app.use(
  cookieSession({
    cookie: {
      httpOnly: true,
      secure: !DEBUG,
      maxAge: null
    },
    secret: SESSION_SECRET || global.SESSION_SECRET
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(authStrategies[loginStrategy]());

app.post(
  "/nexmo",
  wrap(async (req, res) => {
    try {
      const messageId = await nexmo.handleIncomingMessage(req.body);
      res.send(messageId);
    } catch (ex) {
      log.error(ex);
      res.send("done");
    }
  })
);

app.post(
  "/twilio",
  twilio.headerValidator(),
  wrap(async (req, res) => {
    try {
      await twilio.handleIncomingMessage(req.body);
    } catch (ex) {
      log.error(ex);
    }

    const resp = new TwimlResponse();
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(resp.toString());
  })
);

app.post(
  "/nexmo-message-report",
  wrap(async (req, res) => {
    try {
      const body = req.body;
      await nexmo.handleDeliveryReport(body);
    } catch (ex) {
      log.error(ex);
    }
    res.send("done");
  })
);

app.post(
  "/twilio-message-report",
  twilio.headerValidator(),
  wrap(async (req, res) => {
    try {
      await twilio.handleDeliveryReport(req.body);
      const resp = new TwimlResponse();
      res.writeHead(200, { "Content-Type": "text/xml" });
      return res.end(resp.toString());
    } catch (exc) {
      res.status(500).send(exc.message);
    }
  })
);

app.get("/logout-callback", (req, res) => {
  req.logOut();
  res.redirect("/");
});

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
});

addMockFunctionsToSchema({
  schema: executableSchema,
  mocks,
  preserveResolvers: true
});

app.use(
  "/graphql",
  graphqlExpress(request => ({
    schema: executableSchema,
    context: {
      loaders: createLoaders(),
      user: request.user
    }
  }))
);

app.get(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql"
  })
);

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
    } catch (ex) {
      log.error(ex);
      return res.status(500).json({ error: ex.message });
    }
  }
);

function normalize(rawNumber) {
  const number = phoneUtil.parseAndKeepRawInput(rawNumber, "US");
  return phoneUtil.format(number, PNF.E164);
}

app.post("/remove-number-from-campaign", async (req, res) => {
  if (!req.query.secret || req.query.secret !== CONTACT_REMOVAL_SECRET)
    return res.sendStatus(403);

  log.info(`Removing user matching ${JSON.stringify(req.body)}`);
  const phone = req.body.phone;

  if (!phone) {
    return res.status(400).json({ error: "Missing `phone` in request body" });
  }
  const normalizedPhone = normalize(phone);
  await r
    .knex("campaign_contact")
    .where({ cell: normalizedPhone, message_status: "needsMessage" })
    .del();
  return res.sendStatus(200);
});

// This middleware should be last. Return the React app only if no other route is hit.
app.use(appRenderer);

if (port) {
  app.listen(port, () => {
    log.info(`Node app is running on port ${port}`);
  });
}

export default app;
