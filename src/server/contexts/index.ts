/* eslint-disable import/prefer-default-export */
import type { Request } from "express";

import logger from "../../logger";
import MemoizeHelper from "../memoredis";
import { createLoaders, r } from "../models";
import type { SpokeContext, SpokeRequestContext } from "./types";

const createContext = async (): Promise<SpokeContext> => {
  const memoizer = await MemoizeHelper.getMemoizer();

  return {
    db: {
      schema: "public",
      primary: r.knex,
      reader: r.reader
    },
    memoizer
  };
};

const contextByHost: Record<string, SpokeContext> = {};

/**
 * Create a GraphQL context for a request.
 * @param {object} req Express request
 */
export const contextForRequest = async (
  req: Request
): Promise<SpokeRequestContext> => {
  const host = req.get("host");

  if (!host) throw new Error("No host set for request!");

  if (!contextByHost[host]) {
    logger.info(`Created context for host ${host}`);
    contextByHost[host] = await createContext();
  }

  const hostContext = contextByHost[host];
  return {
    user: (<Request & { user: any }>req).user,
    loaders: createLoaders(hostContext),
    ...hostContext
  };
};
