exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table troll_alarm
      add column organization_id integer not null references organization(id)
      on update cascade on delete cascade;

    create index troll_alarm_organization_id_index on troll_alarm(organization_id);

    alter table public.troll_trigger
      add constraint troll_trigger_organization_id_fkey
      foreign key (organization_id) references organization(id)
      on update cascade on delete cascade;

    create function public.get_trollbot_matches (organization_id integer, troll_interval interval)
      returns table (
        message_id integer,
        trigger_token text
      )
    as $$
    declare
      v_troll_trigger tsquery;
    begin
      select to_tsquery(string_agg(token, ' | '))
      into v_troll_trigger
      from troll_trigger
      where troll_trigger.organization_id = get_trollbot_matches.organization_id;

      return query 
        select
          id as message_id,
          lower((
            -- Extract first trigger match from ts-formatted result
            regexp_matches(
              ts_headline(
                'english',
                text,
                v_troll_trigger,
                'MaxFragments=1,MaxWords=2,MinWords=1'
              ),
              '<b>(.*)</b>')
            )[1]
          ) as trigger_token
        from message
        join campaign_contact
          on campaign_contact.id = message.campaign_contact_id
        join campaign
          on campaign.id = campaign_contact.campaign_id
        where
          organization_id = get_trollbot_matches.organization_id
          and message.created_at > now() - get_trollbot_matches.troll_interval
          and is_from_contact = false
          and to_tsvector(text) @@ v_troll_trigger;
    end;
    $$ language plpgsql stable security definer set search_path = "public";

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

    create function public.troll_patrol () returns bigint
    as $$
    declare
      v_result bigint;
    begin
      with job_results as (
        select graphile_worker.add_job(
          'troll-patrol-for-org',
          json_build_object('organization_id', organization.id)
        )
        from organization
      )
      select count(*)
      from job_results
      into v_result;

      return v_result;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop function public.troll_patrol ();
    drop function public.raise_trollbot_alarms (integer, interval);
    drop function public.get_trollbot_matches (integer, interval);

    alter table public.troll_trigger drop constraint troll_trigger_organization_id_fkey;
    alter table public.troll_alarm drop column organization_id;
  `);
};
