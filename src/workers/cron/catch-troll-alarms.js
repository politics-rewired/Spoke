import knex from "knex";
import logger from "../../logger";
import { config } from "../../config";
import knexConfig from "../../server/knex";
import request from "superagent";

const db = knex(knexConfig);

const main = async () => {
  const { rows: newAlarms } = await db.raw(`
    with
      trigger_query as (
        select to_tsquery(array_to_string(array_agg(token), ' | ')) as query
        from troll_trigger
      ),
      trigger_matches as (
        select
          id as message_id,
          lower((
            regexp_matches(
              ts_headline(
                'english',
                text,
                to_tsquery('fuck'), 
                'MaxFragments=1,MaxWords=2,MinWords=1'
              ), 
              '<b>(.*)</b>')
            )[1]
          ) as trigger_token
        from message
        where created_at > now() - interval '6 minute'
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

  if (process.env.TROLL_ALERT_URL) {
    for (const alarm of newAlarms) {
      await request.post(process.env.TROLL_ALERT_URL).send(alarm);
    }
  }
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    logger.error("Error catching troll scripts", { error });
    process.exit(1);
  });
