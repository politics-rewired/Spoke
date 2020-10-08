exports.up = function(knex) {
  return knex.schema.raw(`
    drop function public.raise_trollbot_alarms (integer, interval);
    create function public.raise_trollbot_alarms (organization_id integer, troll_interval interval)
      returns setof troll_alarm
    as $$
    declare
      v_result bigint;
    begin
      return query
      with insert_results as (
        insert into troll_alarm (organization_id, message_id, trigger_token)
        select
          raise_trollbot_alarms.organization_id,
          message_id,
          trigger_token
        from ( select * from public.get_trollbot_matches (organization_id, troll_interval) ) alarms
        on conflict (message_id) do nothing
        returning *
      )
      select *
      from insert_results;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop function public.raise_trollbot_alarms (integer, interval);
    create function public.raise_trollbot_alarms (organization_id integer, troll_interval interval)
      returns bigint
    as $$
    declare
      v_result bigint;
    begin
      with insert_results as (
        insert into troll_alarm (organization_id, message_id, trigger_token)
        select
          raise_trollbot_alarms.organization_id,
          message_id,
          trigger_token
        from ( select * from public.get_trollbot_matches (organization_id, troll_interval) ) alarms
        on conflict (message_id) do nothing
        returning 1
      )
      select count(*)
      from insert_results
      into v_result;

      return v_result;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};
