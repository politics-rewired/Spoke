import { r } from "../../models";

export const refreshExternalSystem = (systemId: string) =>
  r.knex.raw("select * from public.queue_refresh_saved_lists(?)", [systemId]);
