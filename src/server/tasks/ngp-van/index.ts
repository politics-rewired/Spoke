import type { ScheduleConfig } from "graphile-scheduler";
import type { TaskList } from "graphile-worker";

import { config } from "../../../config";
import {
  fetchVANActivistCodes,
  TASK_IDENTIFIER as FETCH_ACTIVIST_CODES_IDENTIFIER
} from "./fetch-van-activist-codes";
import {
  fetchVANResultCodes,
  TASK_IDENTIFIER as FETCH_RESULT_CODE_IDENTIFIER
} from "./fetch-van-result-codes";
import {
  fetchVANSurveyQuestions,
  TASK_IDENTIFIER as FETCH_SURVEY_QUESTIONS_IDENTIFIER
} from "./fetch-van-survey-questions";
import {
  syncCampaignContactToVAN,
  TASK_IDENTIFIER as SYNC_CONTACT_TO_VAN_IDENTIFIER
} from "./sync-campaign-contact-to-van";
import {
  TASK_IDENTIFIER as UPDATE_SYNC_STATUS_IDENTIFIER,
  updateVanSyncStatuses
} from "./update-van-sync-statuses";
import {
  fetchSavedList,
  TASK_IDENTIFIER as FETCH_SAVED_LIST_IDENTIFIER
} from "./van-fetch-saved-list";
import {
  getSavedLists,
  TASK_IDENTIFIER as GET_SAVED_LISTS_IDENTIFIER
} from "./van-get-saved-lists";

export const taskList: TaskList = {
  [GET_SAVED_LISTS_IDENTIFIER]: getSavedLists,
  [FETCH_SAVED_LIST_IDENTIFIER]: fetchSavedList,
  [FETCH_SURVEY_QUESTIONS_IDENTIFIER]: fetchVANSurveyQuestions,
  [FETCH_ACTIVIST_CODES_IDENTIFIER]: fetchVANActivistCodes,
  [FETCH_RESULT_CODE_IDENTIFIER]: fetchVANResultCodes,
  [SYNC_CONTACT_TO_VAN_IDENTIFIER]: syncCampaignContactToVAN,
  [UPDATE_SYNC_STATUS_IDENTIFIER]: updateVanSyncStatuses
};

export const schedules: ScheduleConfig[] = [
  {
    name: UPDATE_SYNC_STATUS_IDENTIFIER,
    taskIdentifier: UPDATE_SYNC_STATUS_IDENTIFIER,
    pattern: "* * * * *",
    timeZone: config.TZ
  }
];
