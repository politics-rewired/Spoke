/* This is a function wrapper to correctly
 catch and handle uncaught exceptions in
 asynchronous code. */
import logger from "../logger";
export default fn => (...args) =>
  fn(...args).catch(ex => {
    logger.error(ex);
    process.nextTick(() => {
      throw ex;
    });
  });
