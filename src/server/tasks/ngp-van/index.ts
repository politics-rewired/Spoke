import type { ScheduleConfig } from "graphile-scheduler";
import type { TaskList } from "graphile-worker";

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
  [FETCH_RESULT_CODE_IDENTIFIER]: fetchVANResultCodes
};

export const schedules: ScheduleConfig[] = [];
