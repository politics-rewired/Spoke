import type { JobHelpers } from "graphile-worker";
import isNil from "lodash/isNil";
import type { SuperAgentRequest } from "superagent";
import { post } from "superagent";

import { config } from "../../config";
import { DateTime } from "../../lib/datetime";
import type { IExternalSystem } from "../api/types";
import { ExternalSystemType } from "../api/types";
import { getSecret } from "../lib/graphile-secrets";
import { r } from "../models";

const DEFAULT_MODE = "0"; // VoterFile mode

interface CanvassResultRow {
  canvassed_at: string;
  result_codes: { result_code_id: number }[];
  activist_codes: { activist_code_id: number }[];
  response_options: {
    survey_question_id: number;
    response_option_id: number;
  }[];
}

interface VANCanvassContextPhone {
  dialingPrefix: "1";
  phoneNumber: string;
}

interface VANActivistCodeResponse {
  type: "ActivistCode";
  activistCodeId: number;
  action: "Apply" | "Remove" | null; // Default: Apply
}

interface VANSurveyResponse {
  type: "SurveyResponse";
  surveyQuestionId: number;
  surveyResponseId: number;
}

export interface VanSecretAuthPayload {
  username: string;
  api_key: { __secret: string };
}

export enum VANDataCollectionStatus {
  Active = "Active",
  Archived = "Archived",
  Inactive = "Inactive"
}

export interface VanAuthPayload {
  username: string;
  api_key: string;
}

const getVanAuth = async (externalSystemId: string, helpers: JobHelpers) => {
  const vanCredentials = await r
    .knex("external_system")
    .where({
      id: externalSystemId
    })
    .first("username", "api_key_ref");

  const apiKey = await helpers.withPgClient((client) =>
    getSecret(client, vanCredentials.api_key_ref)
  );

  return {
    username: vanCredentials.username,
    api_key: apiKey || ""
  } as VanAuthPayload;
};

export const withVan = (van: VanAuthPayload) => (
  request: SuperAgentRequest
) => {
  const [apiKey, existingMode] = van.api_key.split("|");
  const mode = existingMode || DEFAULT_MODE;
  request.auth(van.username, `${apiKey}|${mode}`, { type: "basic" });
  request.url = `${config.VAN_BASE_URL}${request.url}`;
  return request;
};

const formatPhone = (phoneNumber: string): VANCanvassContextPhone => ({
  dialingPrefix: "1",
  phoneNumber: phoneNumber.replace("+1", "")
});

const getCanvassResponsesRaw = (
  campaignContactId: number,
  externalSystemId: string,
  actionIds: Array<number>
) => {
  return r.knex.raw(
    `
      with configured_response_values as (
        select
          qrc.id,
          all_question_response.created_at as canvassed_at
        from all_external_sync_question_response_configuration qrc
        join all_question_response
          on all_question_response.value = qrc.question_response_value
          and all_question_response.interaction_step_id = qrc.interaction_step_id
        where
          campaign_contact_id = ?
          and system_id = ?
          and all_question_response.id = ANY(?)
          and all_question_response.is_deleted = false
      ),
      points as (
        -- Result Codes
        select
          configured_response_values.canvassed_at,
          json_build_object(
            'result_code_id', external_result_code.external_id
          )::jsonb as result_code,
          null::jsonb as activist_code,
          null::jsonb as response_option
        from configured_response_values
        join external_sync_config_question_response_result_code qrrc
          on qrrc.question_response_config_id = configured_response_values.id
        join external_result_code
          on external_result_code.id = qrrc.external_result_code_id

        union

        -- Activist Codes
        select
          configured_response_values.canvassed_at,
          null::jsonb as result_code,
          json_build_object(
            'activist_code_id', external_activist_code.external_id
          )::jsonb as activist_code,
          null::jsonb as response_option
        from configured_response_values
        join external_sync_config_question_response_activist_code qrac
          on qrac.question_response_config_id = configured_response_values.id
        join external_activist_code
          on external_activist_code.id = qrac.external_activist_code_id
        where
          external_activist_code.status = 'active'

        union

        -- Survey Question Response Options
        select
          configured_response_values.canvassed_at,
          null::jsonb as result_code,
          null::jsonb as activist_code,
          json_build_object(
            'survey_question_id', external_survey_question.external_id,
            'response_option_id', external_survey_question_response_option.external_id
          )::jsonb as response_option
        from configured_response_values
        join external_sync_config_question_response_response_option qrro
          on qrro.question_response_config_id = configured_response_values.id
        join external_survey_question_response_option
          on external_survey_question_response_option.id = qrro.external_response_option_id
        join external_survey_question
          on external_survey_question.id = external_survey_question_response_option.external_survey_question_id
        where
          external_survey_question.status = 'active'
      ),
      first_message as (
        select
          date_trunc('day', created_at) as canvassed_at,
          '[]'::json as result_codes,
          '[]'::json as activist_codes,
          '[]'::json as response_options
        from message
        where
          campaign_contact_id = $1
          and is_from_contact = false
        order by id asc
        limit 1
      ),
      canvass_responses as (
        select
          date_trunc('day', canvassed_at) as canvassed_at,
          array_to_json(array_remove(array_agg(result_code), null)) as result_codes,
          array_to_json(array_remove(array_agg(activist_code), null)) as activist_codes,
          array_to_json(array_remove(array_agg(response_option), null)) as response_options
        from points
        group by 1
      )
      select * from canvass_responses
      union all
      select * from first_message where not exists (select 1 from canvass_responses)
    `,
    [campaignContactId, externalSystemId, actionIds]
  );
};

const formatCanvassResponse = (
  canvassResponse: CanvassResultRow,
  phoneId: number,
  phoneNumber: string
) => {
  const {
    canvassed_at: dateCanvassed,
    response_options,
    activist_codes
  } = canvassResponse;

  const surveyResponses: VANSurveyResponse[] = response_options.map(
    (option) => ({
      type: "SurveyResponse",
      surveyQuestionId: option.survey_question_id,
      surveyResponseId: option.response_option_id
    })
  );

  const activistCodes: VANActivistCodeResponse[] = activist_codes.map(
    (code) => ({
      type: "ActivistCode",
      activistCodeId: code.activist_code_id,
      action: "Apply"
    })
  );

  const responses = [...surveyResponses, ...activistCodes];

  return [
    {
      canvassContext: {
        phoneId,
        phone: formatPhone(phoneNumber),
        contactTypeId: config.VAN_CONTACT_TYPE_ID,
        dateCanvassed
      },
      resultCodeId: null,
      responses
    }
  ];
};

const VAN: IExternalSystem = {
  async queueOptOut(
    payload: Record<string, any>,
    helpers: JobHelpers
  ): Promise<void> {
    const { campaignContactId, syncId, externalSystemId } = payload;

    const externalSyncOptOutConfig = await r
      .knex("external_sync_opt_out_configuration")
      .where({ system_id: externalSystemId })
      .first();

    if (isNil(externalSyncOptOutConfig)) {
      await r
        .knex("action_external_system_sync")
        .update({ sync_status: "SKIPPED", sync_error: "No Mapping Found" })
        .where({ id: syncId });
      return;
    }

    await helpers.addJob(
      "sync-contact-opt-out",
      {
        externalSystemType: ExternalSystemType.Van,
        syncId,
        campaignContactId,
        externalSystemId
      },
      {
        jobKey: `sync-contact-opt-out-${campaignContactId}`,
        jobKeyMode: "replace",
        maxAttempts: 5,
        runAt: DateTime.local().plus({ minutes: 1 }).toJSDate()
      }
    );

    await r
      .knex("action_external_system_sync")
      .update({ sync_status: "SYNC_QUEUED" })
      .where({ id: syncId });
  },

  async queueQuestionResponse(
    payload: Record<string, any>,
    helpers: JobHelpers
  ): Promise<void> {
    const { campaignContactId, syncId, externalSystemId } = payload;
    const actionData = await r
      .knex("action_external_system_sync")
      .join(
        "all_question_response",
        "all_question_response.id",
        "action_external_system_sync.action_id"
      )
      .join("all_external_sync_question_response_configuration", function () {
        this.on(function () {
          this.on(
            "all_external_sync_question_response_configuration.interaction_step_id",
            "=",
            "all_question_response.interaction_step_id"
          );
          this.andOn(
            "all_external_sync_question_response_configuration.question_response_value",
            "=",
            "all_question_response.value"
          );
        });
      })
      .where({ "action_external_system_sync.id": syncId })
      .first();

    if (isNil(actionData)) {
      await r
        .knex("action_external_system_sync")
        .update({ sync_status: "SKIPPED", sync_error: "No Mapping Found" })
        .where({ id: syncId });
      return;
    }

    await helpers.addJob(
      "sync-contact-question-response",
      {
        externalSystemType: ExternalSystemType.Van,
        syncId,
        campaignContactId,
        externalSystemId
      },
      {
        jobKey: `sync-contact-question-response-${campaignContactId}`,
        jobKeyMode: "replace",
        maxAttempts: 5,
        runAt: DateTime.local().plus({ minutes: 1 }).toJSDate()
      }
    );

    await r
      .knex("action_external_system_sync")
      .update({ sync_status: "SYNC_QUEUED" })
      .where({ id: syncId });
  },

  async syncQuestionResponse(
    payload: Record<string, any>,
    helpers: JobHelpers
  ): Promise<void> {
    const { campaignContactId, externalSystemId } = payload;

    const campaignContact = await r
      .knex("campaign_contact")
      .where({ id: campaignContactId })
      .first();

    // Get all actions that need to be synced
    // Ignores any that is not mapped
    const pendingActionsToSync = await r
      .knex("action_external_system_sync")
      .join(
        "all_question_response",
        "all_question_response.id",
        "action_external_system_sync.action_id"
      )
      .where({
        sync_status: "SYNC_QUEUED",
        "all_question_response.campaign_contact_id": payload.campaignContactId
      })
      .select(
        "action_external_system_sync.id as sync_id",
        "all_question_response.id as action_id"
      );

    // actionIds to fetch actions
    // syncIds to update sync status to completed
    const actionIds = pendingActionsToSync.map((a) => a.action_id);
    const syncIds = pendingActionsToSync.map((s) => s.sync_id);

    const { rows: canvassResponsesRaw } = await getCanvassResponsesRaw(
      campaignContactId,
      externalSystemId,
      actionIds
    );

    const contactCustomFields = JSON.parse(campaignContact.custom_fields);

    const canvassResponses = await canvassResponsesRaw.map(
      (cR: CanvassResultRow) =>
        formatCanvassResponse(
          cR,
          contactCustomFields.phone_id,
          campaignContact.cell
        )
    );

    const auth = await getVanAuth(externalSystemId, helpers);
    const vanId = campaignContact.external_id;

    for (const canvassResponse of canvassResponses) {
      const response = await post(`/people/${vanId}/canvassResponses`)
        .use(withVan(auth))
        .send(canvassResponse);

      if (response.status === 204) {
        await r
          .knex("action_external_system_sync")
          .whereIn("id", syncIds)
          .update({
            sync_status: "SYNCED",
            synced_at: r.knex.fn.now()
          });
      } else {
        helpers.logger.error(`sync_campaign_to_van__incorrect_response_code`, {
          response: {
            status: response.status,
            body: response.body
          }
        });
        await r
          .knex("action_external_system_sync")
          .whereIn("id", syncIds)
          .update({
            sync_status: "SYNC_FAILED",
            sync_error: response.body
          });
      }
    }
  },

  async syncOptOut(
    payload: Record<string, any>,
    helpers: JobHelpers
  ): Promise<void> {
    const { syncId, campaignContactId, externalSystemId } = payload;

    const campaignContact = await r
      .knex("campaign_contact")
      .where({ id: campaignContactId })
      .first();

    const externalSystem = await r
      .knex("external_system")
      .join(
        "external_sync_opt_out_configuration",
        "external_system.id",
        "external_sync_opt_out_configuration.system_id"
      )
      .join(
        "external_result_code",
        "external_sync_opt_out_configuration.external_result_code_id",
        "external_result_code.id"
      )
      .where({ "external_system.id": externalSystemId })
      .select([
        "external_system.id",
        "external_result_code.external_id as result_code_id"
      ])
      .first();

    const syncAction = await r
      .knex("action_external_system_sync")
      .where({ id: syncId })
      .first();

    const contactCustomFields = JSON.parse(campaignContact.custom_fields);

    const canvassResponse = {
      canvassContext: {
        phoneId: contactCustomFields.phone_id,
        phone: formatPhone(campaignContact.cell),
        contactTypeId: config.VAN_CONTACT_TYPE_ID,
        dateCanvassed: DateTime.fromJSDate(
          new Date(syncAction.created_at)
        ).toFormat("MM-dd-yyyy")
      },
      resultCodeId: externalSystem.result_code_id,
      responses: null
    };

    const auth = await getVanAuth(externalSystemId, helpers);
    const vanId = campaignContact.external_id;

    const response = await post(`/people/${vanId}/canvassResponses`)
      .use(withVan(auth))
      .send(canvassResponse);

    if (response.status === 204) {
      await r.knex("action_external_system_sync").where({ id: syncId }).update({
        sync_status: "SYNCED",
        synced_at: r.knex.fn.now()
      });
    } else {
      helpers.logger.error(`sync_campaign_to_van__incorrect_response_code`, {
        response: {
          status: response.status,
          body: response.body
        }
      });
      await r.knex("action_external_system_sync").where({ id: syncId }).update({
        sync_status: "SYNC_FAILED",
        sync_error: response.body
      });
    }
  }
};

export default VAN;
