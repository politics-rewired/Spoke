import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  OptOut: {
    ...sqlResolvers(["id", "cell", "createdAt"]),
    assignment: async (optOut, _, { loaders }) =>
      loaders.assignment.load(optOut.assignment_id)
  }
};

export default resolvers;
