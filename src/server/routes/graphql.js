import express from "express";
const router = express.Router();
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";

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

if (!config.isProduction) {
  addMockFunctionsToSchema({
    schema: executableSchema,
    mocks,
    preserveResolvers: true
  });

  router.get(
    "/graphiql",
    graphiqlExpress({
      endpointURL: "/graphql"
    })
  );
}

router.use(
  "/graphql",
  graphqlExpress(request => ({
    schema: executableSchema,
    context: {
      loaders: createLoaders(),
      user: request.user
    }
  }))
);

export default router;
