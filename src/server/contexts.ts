/* eslint-disable import/prefer-default-export */
import { Request } from "express";
import Knex from "knex";
import createMemoizer from "memoredis";

import { config } from "../config";
import logger from "../logger";
import { createLoaders, r } from "./models";
import { Memoizer } from "./types";

export interface SpokeDbContext {
  schema: string;
  master: Knex;
  reader: Knex;
}

export interface SpokeContext {
  db: SpokeDbContext;
  memoizer: Memoizer;
}

export interface SpokeRequestContext extends SpokeContext {
  user: any;
  loaders: any;
}

const createHostMemoizer = (_host: string): Memoizer => {
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

const createContext = (host: string): SpokeContext => ({
  db: {
    schema: "public",
    master: r.knex,
    reader: r.reader
  },
  memoizer: createHostMemoizer(host)
});

const contextByHost: Record<string, SpokeContext> = {};

/**
 * Create a GraphQL context for a request.
 * @param {object} req Express request
 */
export const contextForRequest = (req: Request): SpokeRequestContext => {
  const host = req.get("host");

  if (!host) throw new Error("No host set for request!");

  if (!contextByHost[host]) {
    logger.info(`Created context for host ${host}`);
    contextByHost[host] = createContext(host);
  }

  const hostContext = contextByHost[host];
  return {
    user: (<Request & { user: any }>req).user,
    loaders: createLoaders(hostContext),
    ...hostContext
  };
};
