exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace function regconfig_mode (mode text) returns regconfig
    as $$
    begin
      return cast(mode as regconfig);
    end
    $$
    language plpgsql immutable;

    alter table public.troll_trigger
      drop column compiled_tsquery,
      alter column mode type text,
      add constraint valid_regconfig check (mode = (mode::regconfig)::text),
      alter column mode set default 'english',
      add column compiled_tsquery tsquery generated always as (to_tsquery(regconfig_mode(mode), token::text)) stored;

create or replace function public.get_trollbot_matches (organization_id integer, troll_interval interval)
  returns table (
    message_id integer,
    trigger_token text
  )
  as $$
  begin
    return query
      with troll_tokens as (
        select token, mode, compiled_tsquery
        from troll_trigger
        where troll_trigger.organization_id = get_trollbot_matches.organization_id
      ),
      ts_queries as (
        select mode, to_tsquery('(' || array_to_string(array_agg(token), ') | (') || ')') as tsquery
        from troll_trigger
        where troll_trigger.organization_id = get_trollbot_matches.organization_id
        group by 1
      ),
      bad_messages as (
        select distinct on (message.id) message.id, mode, text, is_from_contact
        from message
        join campaign_contact
          on campaign_contact.id = message.campaign_contact_id
        join campaign
          on campaign.id = campaign_contact.campaign_id
        join ts_queries on to_tsvector(regconfig_mode(mode), message.text) @@ ts_queries.tsquery
        where true
          and message.created_at >= now() - get_trollbot_matches.troll_interval
          and message.is_from_contact = false
          and campaign.organization_id = get_trollbot_matches.organization_id
        order by message.id, mode
      ),
      messages_with_match as (
        select bad_messages.id, bad_messages.text, token
        from bad_messages
        join troll_tokens on to_tsvector(regconfig_mode(troll_tokens.mode), bad_messages.text) @@ troll_tokens.compiled_tsquery
        where troll_tokens.mode = bad_messages.mode
      )
      select id, token::text as trigger_token
      from messages_with_match;
  end;
  $$ language plpgsql stable security definer set search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table public.troll_trigger
      drop column compiled_tsquery,
      drop constraint valid_regconfig,
      alter column mode drop default,
      alter column mode type regconfig using regconfig_mode(mode),
      alter column mode set default 'english'::regconfig,
      add column compiled_tsquery tsquery generated always as (to_tsquery(mode, token::text)) stored;

    create or replace function public.get_trollbot_matches (organization_id integer, troll_interval interval)
      returns table (
        message_id integer,
        trigger_token text
      )
      as $$
      begin
        return query
          with troll_tokens as (
            select token, mode, compiled_tsquery
            from troll_trigger
            where troll_trigger.organization_id = get_trollbot_matches.organization_id
          ),
          ts_queries as (
            select mode, to_tsquery('(' || array_to_string(array_agg(token), ') | (') || ')') as tsquery
            from troll_trigger
            where troll_trigger.organization_id = get_trollbot_matches.organization_id
            group by 1
          ),
          bad_messages as (
            select distinct on (message.id) message.id, mode, text, is_from_contact
            from message
            join campaign_contact
              on campaign_contact.id = message.campaign_contact_id
            join campaign
              on campaign.id = campaign_contact.campaign_id
            join ts_queries on to_tsvector(mode, message.text) @@ ts_queries.tsquery
            where true
              and message.created_at >= now() - get_trollbot_matches.troll_interval
              and message.is_from_contact = false
              and campaign.organization_id = get_trollbot_matches.organization_id
            order by message.id, mode
          ),
          messages_with_match as (
            select bad_messages.id, bad_messages.text, token
            from bad_messages
            join troll_tokens on to_tsvector(troll_tokens.mode, bad_messages.text) @@ troll_tokens.compiled_tsquery
            where troll_tokens.mode = bad_messages.mode
          )
          select id, token::text as trigger_token
          from messages_with_match;
      end;
      $$ language plpgsql stable security definer set search_path = "public";

    drop function regconfig_mode (text);
  `);
};
