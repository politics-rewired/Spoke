export const resolvers = {
  AssignmentRequest: {
    createdAt: async (assignmentRequest, _, _1) => assignmentRequest.created_at
  }
};

export default resolvers;
