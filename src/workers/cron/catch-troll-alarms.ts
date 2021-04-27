import knex from "knex";
import request from "superagent";

import logger from "../../logger";
import knexConfig from "../../server/knex";

const db = knex(knexConfig);

const { TROLL_ALERT_URL, TROLL_ALERT_PERIOD_MINUTES = "6" } = process.env;
const ALERT_PERIOD = parseInt(TROLL_ALERT_PERIOD_MINUTES, 10);

const batchLogger = logger.child({ batch_timestamp: new Date().getTime() });

interface TrollAlarmRecord {
  trigger_token: string;
  text: string;
  first_name: string;
  last_name: string;
  email: string;
}

const main = async (): Promise<TrollAlarmRecord[]> => {
  const { rows: newAlarms } = await db.raw(`
    with
      troll_tokens as (
        select organization_id, token, config
        from troll_trigger
        cross join (select * from (values
          ('simple'::regconfig),
          ('english'::regconfig),
          ('spanish'::regconfig)
        ) regconfigs (config)) types
      ),
      trigger_matches as (
        select distinct on (message.id)
          organization_id,
          message.id as message_id,
          troll_tokens.token as matching_token
        from message
        join troll_tokens
          on to_tsvector(troll_tokens.config, message.text) @@ to_tsquery(troll_tokens.config, troll_tokens.token)
        where true -- message.created_at >= now() - interval '${ALERT_PERIOD} minute'
          and is_from_contact = false
      ),
      insert_results as (
        insert into troll_alarm (organization_id, message_id, trigger_token)
        select organization_id, message_id, matching_token
        from trigger_matches
        on conflict (message_id) do nothing
        returning *
      )
      select trigger_token, text, public.user.first_name, public.user.last_name, public.user.email
      from insert_results
      join message
        on message.id = insert_results.message_id
      left join public.user
        on public.user.id = message.user_id
  `);

  batchLogger.info(`TrollBot completed and raised ${newAlarms.length} alarms`);

  return newAlarms;
};

const raiseAlarms = async (alarms: TrollAlarmRecord[]) => {
  if (TROLL_ALERT_URL) {
    for (const alarm of alarms) {
      await request.post(TROLL_ALERT_URL).send(alarm);
    }
  }
};

main()
  .catch((err) => {
    batchLogger.error("Error running TrollBot script: ", err);
    process.exit(1);
  })
  .then(raiseAlarms)
  .then(() => process.exit(0))
  .catch((err) => {
    batchLogger.error("Error raising external troll alarms: ", err);
    process.exit(1);
  });
