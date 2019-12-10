import express from "express";
const router = express.Router();
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";

import mocks from "../api/mocks";
// import { createLoaders } from "../models";
import { config } from "../../config";
import { resolvers } from "../api/schema";
import { schema } from "../../api/schema";

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
});

addMockFunctionsToSchema({
  schema: executableSchema,
  mocks,
  preserveResolvers: true
});

router.use(
  "/graphql",
  graphqlExpress(request => ({
    schema: executableSchema,
    context: {
      // TODO: refactor this
      // loaders: createLoaders(),
      user: request.user
    }
  }))
);

if (!config.isProduction) {
  router.get(
    "/graphiql",
    graphiqlExpress({
      endpointURL: "/graphql"
    })
  );
}

export default router;
