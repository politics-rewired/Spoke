/* eslint-disable import/prefer-default-export */
import createMemoizer from "memoredis";

import { config } from "../config";
import logger from "../logger";
import { createLoaders } from "./models";
import thinky from "./models/thinky";

const createHostMemoizer = (_host) => {
  const opts = config.MEMOREDIS_URL
    ? {
        clientOpts: config.MEMOREDIS_URL,
        prefix: config.MEMOREDIS_PREFIX,
        logger
      }
    : { emptyMode: true, logger };

  const memoizer = createMemoizer(opts);
  return memoizer;
};

const createContext = (host) => ({
  db: {
    schema: "public",
    master: thinky.r.knex,
    reader: thinky.r.reader
  },
  memoizer: createHostMemoizer(host)
});

const contextByHost = {};

/**
 * Create a GraphQL context for a request.
 * @param {object} req Express request
 */
export const contextForRequest = (req) => {
  const host = req.get("host");
  if (!contextByHost[host]) {
    contextByHost[host] = createContext(host);
  }

  const hostContext = contextByHost[host];
  return {
    loaders: createLoaders(hostContext),
    ...hostContext
  };
};
