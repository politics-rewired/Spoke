/* eslint-disable import/prefer-default-export */
import type { Request } from "express";
import createMemoizer from "memoredis";

import logger from "../../logger";
import type Memoizer from "../memoredis";
import { createLoaders, r } from "../models";
import type { SpokeContext, SpokeRequestContext } from "./types";

const createContext = (_host: string): SpokeContext => ({
  db: {
    schema: "public",
    primary: r.knex,
    reader: r.reader
  },
  memoizer: createMemoizer({ emptyMode: true }).then((memoizer: Memoizer) => {
    return memoizer;
  })
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
