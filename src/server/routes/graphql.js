import { ApolloError, ApolloServer } from "apollo-server-express";
import express from "express";
import { addMockFunctionsToSchema, makeExecutableSchema } from "graphql-tools";

import { schema } from "../../api/schema";
import { config } from "../../config";
import logger from "../../logger";
import mocks from "../api/mocks";
import { resolvers } from "../api/schema";
import { contextForRequest } from "../contexts";

const router = express.Router();

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
});

const formatError = (err) => {
  // Ignore intentional ApolloErrors
  if (err.originalError instanceof ApolloError) {
    return err;
  }

  // node-postgres does not use an Error subclass so we check for schema property
  const hasSchema = Object.prototype.hasOwnProperty.call(
    err.originalError,
    "schema"
  );
  if (hasSchema && config.isProduction) {
    logger.error("Postgres error: ", err);
    return new Error("Internal server error");
  }

  logger.error("GraphQL error: ", err);
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
  context: ({ req, res: _res }) => ({
    user: req.user,
    ...contextForRequest(req)
  })
});

server.applyMiddleware({
  app: router,
  path: "/graphql"
});

export default router;
