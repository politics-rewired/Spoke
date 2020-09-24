import { Task } from "pg-compose";
import { config } from "../../config";

export interface TrollPatrolForOrganizationPayload {
  organization_id: number;
}

export const trollPatrol: Task = async (_payload, helpers) => {
  await helpers.query(`select * from public.troll_patrol()`);
};

export const trollPatrolForOrganization: Task = async (payload, helpers) => {
  const { organization_id } = payload as TrollPatrolForOrganizationPayload;
  const mins = config.TROLL_ALERT_PERIOD_MINUTES;

  await helpers.query(
    `select * from public.raise_trollbot_alarms ($1, '${mins} minute'::interval)`,
    [organization_id]
  );
};
