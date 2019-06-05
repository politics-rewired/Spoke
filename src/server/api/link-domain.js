import { mapFieldsToModel } from "./lib/utils";
import { LinkDomain, UnhealthyLinkDomain } from "../models";

export const resolvers = {
  LinkDomain: {
    ...mapFieldsToModel(
      [
        "id",
        "domain",
        "maxUsageCount",
        "currentUsageCount",
        "isManuallyDisabled",
        "cycledOutAt",
        "createdAt"
      ],
      LinkDomain
    ),
    isHealthy: async linkDomain => {
      return linkDomain.is_healthy;
    }
  },
  UnhealthyLinkDomain: {
    ...mapFieldsToModel(
      ["id", "domain", "createdAt", "healthyAgainAt"],
      UnhealthyLinkDomain
    )
  }
};
