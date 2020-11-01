import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  QuestionResponse: {
    ...sqlResolvers(["id", "value"]),
    question: async (question, _, { loaders }) =>
      loaders.question.load(question.id)
  }
};

export default resolvers;
