import { Task } from "pg-compose";
import { post } from "superagent";

import { r } from "../models";
import logger from "../../logger";

import { VanAuthPayload, withVan } from "../lib/external-systems";

class VANSyncError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super("sync_campaign_to_van__incorrect_response_code");
    this.status = status;
    this.body = body;
  }
}

export interface VANCanvassContext {
  phoneId: number;
  contactTypeId?: number; //	Optional; a valid contact type ID
  inputTypeId?: number; //	Optional; a valid input type ID (defaults to 11 → API)
  dateCanvassed?: string; //	Optional; the ISO-8601 formatted date that the canvass attempt was made (defaults to today’s date)
}

export interface VANActivistCodeResponse {
  type: "ActivistCode";
  activistCodeId: number;
  action: "Apply" | "Remove" | null; // Default: Apply
}

export interface VANSurveyResponse {
  type: "SurveyResponse";
  surveyQuestionId: number;
  surveyResponseId: number;
}

export interface VANVolunteerActivityResponse {
  type: "VolunteerActivity";
  volunteerActivityId: number | null;
  action: "Apply" | "Remove" | null; // Default: Apply
}

export type VANScriptResponse =
  | VANActivistCodeResponse
  | VANSurveyResponse
  | VANVolunteerActivityResponse;

// If no `resultCodeId` is specified, `responses` must be specified. Conversely, if `responses`
// are specified, `resultCodeId` must be null (a result of Canvassed is implied). The
// resultCodeId must be a valid Result Code in the current context.
export interface VANCanvassResponse {
  canvassContext: VANCanvassContext | null;
  resultCodeId: number | null;
  responses: VANScriptResponse[] | null;
}

interface CanvassResultRow {
  canvassed_at: string;
  result_codes: { result_code_id: number }[];
  activist_codes: { activist_code_id: number }[];
  response_options: {
    survey_question_id: number;
    response_option_id: number;
  }[];
}

export interface SyncCampaignContactToVANPayload extends VanAuthPayload {
  system_id: string;
  contact_id: string;
  cc_created_at: string;
  external_id: string;
  phone_id: number;
}

export const syncCampaignContactToVAN: Task = async (
  payload: SyncCampaignContactToVANPayload
) => {
  const {
    system_id: systemId,
    contact_id: contactId,
    // canvassed_at: dateCanvassed,
    external_id: vanId,
    phone_id: phoneId
  } = payload;

  // helpers.withPgClient was throwing an error for this query:
  //     syntax error near ")"
  // I couldn't reproduce the error in psql. Going with knex instead...
  const canvasResultsRaw: CanvassResultRow[] = await r.knex
    .raw(
      `
        with configured_response_values as (
          select
            qrc.id,
            question_response.created_at as canvassed_at
          from all_external_sync_question_response_configuration qrc
          join question_response
            on question_response.value = qrc.question_response_value
            and question_response.interaction_step_id = qrc.interaction_step_id
          where
            campaign_contact_id = ?
            and system_id = ?
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
        )
        select
          date_trunc('day', canvassed_at) as canvassed_at,
          array_to_json(array_remove(array_agg(result_code), null)) as result_codes,
          array_to_json(array_remove(array_agg(activist_code), null)) as activist_codes,
          array_to_json(array_remove(array_agg(response_option), null)) as response_options
        from points
        group by 1
      `,
      [contactId, systemId]
    )
    .then(({ rows }: { rows: CanvassResultRow[] }) => rows);

  if (canvasResultsRaw.length === 0) return;

  let chain = Promise.resolve();
  for (const canvassResult of canvasResultsRaw) {
    chain = chain.then(async () => {
      const {
        canvassed_at: dateCanvassed,
        response_options,
        activist_codes,
        result_codes
      } = canvassResult;

      const surveyResponses: VANSurveyResponse[] = response_options.map(
        option => ({
          type: "SurveyResponse",
          surveyQuestionId: option.survey_question_id,
          surveyResponseId: option.response_option_id
        })
      );

      const activistCodes: VANActivistCodeResponse[] = activist_codes.map(
        code => ({
          type: "ActivistCode",
          activistCodeId: code.activist_code_id,
          action: "Apply"
        })
      );

      const resultCodeId = result_codes[0]
        ? result_codes[0].result_code_id
        : null;

      const responses = [...surveyResponses, ...activistCodes];
      const hasResponses = responses.length > 0;

      const canvassResponse: VANCanvassResponse = {
        canvassContext: {
          phoneId,
          dateCanvassed
        },
        resultCodeId: hasResponses ? null : resultCodeId,
        responses: hasResponses ? responses : null
      };

      const response = await post(`/people/${vanId}/canvassResponses`)
        .use(withVan(payload))
        .send(canvassResponse);

      if (response.status !== 204) {
        logger.error(`sync_campaign_to_van__incorrect_response_code`, {
          response: {
            status: response.status,
            body: response.body
          }
        });
        throw new VANSyncError(response.status, response.body);
      }
    });
  }

  await chain;
};

export default syncCampaignContactToVAN;
