/* eslint-disable import/prefer-default-export */
import { VanOperationMode } from "../../api/external-system";
import { r } from "../models";
import { formatPage } from "./lib/pagination";
import { sqlResolvers } from "./lib/utils";
import type { ExternalSystemType, RelayPageArgs } from "./types";

interface ExternalSystem {
  id: string;
  organization_id: number;
  name: string;
  type: ExternalSystemType;
  username: string;
  api_key_ref: string;
  operation_mode: string;
}

interface StatusFilterArgs {
  filter: {
    status: string | null;
  } | null;
}

export const resolvers = {
  ExternalSystem: {
    ...sqlResolvers([
      "id",
      "organizationId",
      "name",
      "username",
      "createdAt",
      "updatedAt",
      "syncedAt"
    ]),
    type: (system: ExternalSystem) => system.type.toUpperCase(),
    apiKey: async (system: ExternalSystem) => {
      // Backwards compatibility for API keys added before organization ID was prepended
      const components = system.api_key_ref.split("|");
      return components.length === 1 ? components[0] : components[1];
    },
    lists: async (system: ExternalSystem, { after, first }: RelayPageArgs) => {
      const query = r.reader("external_list").where({ system_id: system.id });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    },
    surveyQuestions: async (
      system: ExternalSystem,
      { filter, after, first }: RelayPageArgs & StatusFilterArgs
    ) => {
      const { status } = filter || {};
      const queryFilter = status ? { status: status.toLowerCase() } : {};

      const query = r
        .reader("external_survey_question")
        .where({ system_id: system.id, ...queryFilter });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    },
    activistCodes: async (
      system: ExternalSystem,
      { filter, after, first }: RelayPageArgs & StatusFilterArgs
    ) => {
      const { status } = filter || {};
      const queryFilter = status ? { status: status.toLowerCase() } : {};

      const query = r
        .reader("external_activist_code")
        .where({ system_id: system.id, ...queryFilter });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    },
    resultCodes: async (
      system: ExternalSystem,
      { after, first }: RelayPageArgs
    ) => {
      const query = r
        .reader("external_result_code")
        .where({ system_id: system.id });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    },
    optOutSyncConfig: (system: ExternalSystem) =>
      r
        .reader("public.external_sync_opt_out_configuration")
        .where({ system_id: system.id })
        .first()
        .then((result) => result || null),
    operationMode: async (system: ExternalSystem) => {
      const components = system.api_key_ref.split("|");
      const operationMode =
        components.length === 3 ? components[2] : components[1];
      if (operationMode === "1") {
        return VanOperationMode.MYCAMPAIGN;
      }
      return VanOperationMode.VOTERFILE;
    }
  }
};
