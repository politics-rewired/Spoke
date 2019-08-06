import { config } from "../config";
import minilog from "minilog";
import { isClient } from "./is-client";
const Rollbar = require("rollbar");
let rollbar = undefined;
let log = null;

if (isClient()) {
  minilog.enable();
  log = minilog("client");
  const existingErrorLogger = log.error;
  log.error = (...err) => {
    const errObj = err;
    if (window.rollbar) {
      window.rollbar.init({
        accessToken: window.ROLLBAR_CLIENT_TOKEN,
        enabled: true,
        captureUncaught: true,
        captureUnhandledRejections: true,
        payload: {
          environment: "production"
        }
      });
      window.rollbar.error(...errObj);
    }
    existingErrorLogger.call(...errObj);
  };
} else {
  let enableRollbar = false;
  if (config.isProduction && config.ROLLBAR_ACCESS_TOKEN) {
    enableRollbar = true;
    rollbar = new Rollbar({
      accessToken: config.ROLLBAR_ACCESS_TOKEN,
      captureUncaught: true,
      captureUnhandledRejections: true
    });
  }

  minilog.suggest.deny(/.*/, "debug");

  minilog
    .enable()
    .pipe(minilog.backends.console.formatWithStack)
    .pipe(minilog.backends.console);

  log = minilog("backend");
  const existingErrorLogger = log.error;
  log.error = (...err) => {
    if (enableRollbar) {
      if (typeof err === "object") {
        rollbar.error(...err);
      } else if (typeof err === "string") {
        rollbar.critical(...err);
      } else {
        rollbar.error("Got backend error with no error message");
      }
    }

    if (err[0] && err[0].stack) {
      existingErrorLogger(err[0].stack);
    } else {
      existingErrorLogger(...err);
    }
  };

  // We always want to log with console on Lambda
  log = config.LAMBDA_DEBUG_LOG ? console : log;
}

export { log };
