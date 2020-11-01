import knex from "knex";
import request from "superagent";

import logger from "../../logger";
import knexConfig from "../../server/knex";

const db = knex(knexConfig);

const { TROLL_ALERT_URL } = process.env;
let { TROLL_ALERT_PERIOD_MINUTES = 6 } = process.env;
TROLL_ALERT_PERIOD_MINUTES = parseInt(TROLL_ALERT_PERIOD_MINUTES, 10);

const batchLogger = logger.child({ batch_timestamp: new Date().getTime() });

const main = async () => {
  const { rows: newAlarms } = await db.raw(`
    with
      trigger_query as (
        select to_tsquery(string_agg(token, ' | ')) as query
        from troll_trigger
      ),
      trigger_matches as (
        select
          id as message_id,
          lower((
            -- Extract first trigger match from ts-formatted result
            regexp_matches(
              ts_headline(
                'english',
                text,
                ( select query from trigger_query ),
                'MaxFragments=1,MaxWords=2,MinWords=1'
              ),
              '<b>(.*)</b>')
            )[1]
          ) as trigger_token
        from message
        where message.created_at > now() - interval '${TROLL_ALERT_PERIOD_MINUTES} minute'
          and is_from_contact = false
          and to_tsvector(text) @@ ( select query from trigger_query )
      ),
      insert_results as (
        insert into troll_alarm (message_id, trigger_token)
        select message_id, trigger_token
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

const raiseAlarms = async alarms => {
  if (TROLL_ALERT_URL) {
    for (const alarm of alarms) {
      await request.post(TROLL_ALERT_URL).send(alarm);
    }
  }
};

main()
  .catch(err => {
    batchLogger.error("Error running TrollBot script: ", err);
    process.exit(1);
  })
  .then(raiseAlarms)
  .then(() => process.exit(0))
  .catch(err => {
    batchLogger.error("Error raising external troll alarms: ", err);
    process.exit(1);
  });
