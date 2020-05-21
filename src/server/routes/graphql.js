import express from "express";
const router = express.Router();
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";

import logger from "../../logger";
import mocks from "../api/mocks";
import { createLoaders } from "../models";
import { config } from "../../config";
import { resolvers } from "../api/schema";
import { schema } from "../../api/schema";

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
});

const formatError = err => {
  // node-postgres does not use an Error subclass so we check for schema property
  console.log(err);
  if (err.originalError.hasOwnProperty("schema") && config.isProduction) {
    logger.error("Postgres error: ", err);
    return new Error("Internal server error");
  }

  return err;
};

addMockFunctionsToSchema({
  schema: executableSchema,
  mocks,
  preserveResolvers: true
});

const server = new ApolloServer({
  schema: executableSchema,
  formatError,
  uploads: {
    maxFileSize: 50 * 1000 * 1000, // 50 MB
    maxFiles: 20
  },
  debug: !config.isProduction,
  introspection: !config.isProduction,
  playground: !config.isProduction,
  context: ({ req, res }) => ({
    loaders: createLoaders(),
    user: req.user
  })
});

server.applyMiddleware({
  app: router,
  path: "/graphql"
});

export default router;
