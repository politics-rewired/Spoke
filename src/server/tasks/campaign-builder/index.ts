import type { ScheduleConfig } from "graphile-scheduler";
import type { TaskList } from "graphile-worker";

import {
  importContactCsvFromUrl,
  TASK_IDENTIFIER as IMPORT_CONTACT_CSV_FROM_URL_IDENTIFIER
} from "./import-contact-csv-from-url";

export const taskList: TaskList = {
  [IMPORT_CONTACT_CSV_FROM_URL_IDENTIFIER]: importContactCsvFromUrl
};

export const schedules: ScheduleConfig[] = [];
