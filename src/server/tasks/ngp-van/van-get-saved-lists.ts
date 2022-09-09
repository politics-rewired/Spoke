import type { Task } from "graphile-worker";
import { get } from "superagent";

import type { VanSecretAuthPayload } from "../../lib/external-systems";
import { withVan } from "../../lib/external-systems";
import { getVanAuth, handleResult } from "./lib";

export const TASK_IDENTIFIER = "van-get-saved-lists";

const VAN_SAVED_LISTS_MAX_PAGE_SIZE = 100;

interface GetSavedListsPayload extends VanSecretAuthPayload {
  van_system_id: string;
}

interface VanSavedList {
  savedListId: number;
  name: string;
  description: string;
  listCount: number;
  doorCount: number;
}

export const getSavedLists: Task = async (
  payload: GetSavedListsPayload,
  helpers
) => {
  const auth = await getVanAuth(helpers, payload);

  let offset = 0;
  let returnCount = 0;
  let savedLists: VanSavedList[] = [];
  do {
    const response = await get("/savedLists")
      .query({
        $top: VAN_SAVED_LISTS_MAX_PAGE_SIZE,
        $skip: offset
      })
      .use(withVan(auth));
    const { body } = response;
    returnCount = body.items.length;
    offset += VAN_SAVED_LISTS_MAX_PAGE_SIZE;
    savedLists = savedLists.concat(body.items);
  } while (returnCount > 0);

  const result = savedLists.map((sl) => ({
    saved_list_id: sl.savedListId,
    name: sl.name,
    description: sl.description ?? "",
    list_count: sl.listCount,
    door_count: sl.doorCount,
    van_system_id: payload.van_system_id
  }));

  await handleResult(helpers, payload, result);
};
