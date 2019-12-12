import { r, createLoaders } from "./models";

const createContext = _host => ({
  // TODO: loaders must be schema-aware
  loaders: createLoaders(),
  db: {
    schema: "public",
    master: r.knex,
    reader: r.reader
  }
});

// TODO: this in-memory cache should be replaced with a Redis cache to allow for fleet-wide
// invalidation
const contextByHost = {};

/**
 * Create a GraphQL context for a request.
 * @param {object} req Express request
 */
export const contextForRequest = req => {
  const host = req.get("host");
  if (!contextByHost[host]) {
    contextByHost[host] = createContext(host);
  }
  return contextByHost[host];
};
