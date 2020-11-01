import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  LinkDomain: {
    ...sqlResolvers([
      "id",
      "domain",
      "maxUsageCount",
      "currentUsageCount",
      "isManuallyDisabled",
      "cycledOutAt",
      "createdAt"
    ]),
    isHealthy: async (linkDomain) => {
      return linkDomain.is_healthy;
    }
  },
  UnhealthyLinkDomain: {
    ...sqlResolvers(["id", "domain", "createdAt", "healthyAgainAt"])
  }
};

export default resolvers;
