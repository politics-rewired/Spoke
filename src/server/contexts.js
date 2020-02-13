/* eslint-disable import/prefer-default-export */
import { createLoaders } from "./models";
import thinky from "./models/thinky";

const createContext = (_host) => ({
  db: {
    schema: "public",
    master: thinky.r.knex,
    reader: thinky.r.reader
  }
});

// TODO: this in-memory cache should be replaced with a Redis cache to allow for fleet-wide
// invalidation
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
