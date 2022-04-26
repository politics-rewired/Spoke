import fakeredis from "fakeredis";
import type { Knex } from "knex";
import knex from "knex";
import type { RedisClient } from "redis";
import redis from "redis-promisify";
import dumbThinky from "rethink-knex-adapter";

import { config } from "../../config";
import knexConfig from "../knex";

export interface RethinkQuery {
  k: Knex;
  knex: Knex;
  reader: Knex;
  redis?: RedisClient;
  getCount: (query: Knex.QueryBuilder) => Promise<number>;
  parseCount: <T>(query: Knex.QueryBuilder | T[]) => Promise<number>;
}

export interface ThinkyConnection {
  config: Knex.Config | string;
  k: Knex;
  r: RethinkQuery;
}

// Instantiate the rethink-knex-adapter using the config defined in
// /src/server/knex.js.
const thinkyConn: ThinkyConnection = dumbThinky(knexConfig);

thinkyConn.r.reader = knexConfig.useReader
  ? knex(knexConfig.readerConfig)
  : thinkyConn.r.knex;

thinkyConn.r.getCount = async (query: Knex.QueryBuilder) => {
  // helper method to get a count result
  // with fewer bugs.  Using knex's .count()
  // results in a 'count' key on postgres, but a 'count(*)' key
  // on sqlite -- ridiculous.  This smooths that out
  if (Array.isArray(query)) {
    return query.length;
  }
  return Number((await query.count("* as count").first()).count);
};

/**
 * Helper method to parse the result of a knex `count` query (see above).
 */
thinkyConn.r.parseCount = async <T>(query: Knex.QueryBuilder | T[]) => {
  if (Array.isArray(query)) {
    return query.length;
  }

  const result = (await query)[0];
  const keys = Object.keys(result);
  if (keys.length === 1) {
    const countKey = keys[0];
    // Note that in Postgres, count returns a bigint type which will be a String and not a Number
    // -- https://knexjs.org/#Builder-count
    return parseInt(result[countKey], 10);
  }

  throw new Error("Multiple columns returned by the query!");
};

if (config.REDIS_URL) {
  thinkyConn.r.redis = redis.createClient({ url: config.REDIS_URL });
} else if (config.REDIS_FAKE) {
  Promise.promisifyAll(fakeredis.RedisClient.prototype);
  Promise.promisifyAll(fakeredis.Multi.prototype);

  thinkyConn.r.redis = fakeredis.createClient();
}

export default thinkyConn;
