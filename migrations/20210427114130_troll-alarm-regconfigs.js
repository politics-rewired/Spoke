exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace function public.get_trollbot_matches (organization_id integer, troll_interval interval)
      returns table (
        message_id integer,
        trigger_token text
      )
    as $$
    begin
      return query
        with troll_tokens as (
          select token, config
          from troll_trigger
          cross join (select * from (values
            ('simple'::regconfig),
            ('english'::regconfig),
            ('spanish'::regconfig)
          ) regconfigs (config)) types
          where troll_trigger.organization_id = get_trollbot_matches.organization_id
        )
        select distinct on (message.id)
          message.id as message_id,
          troll_tokens.token::text as trigger_token
        from message
        join campaign_contact
          on campaign_contact.id = message.campaign_contact_id
        join campaign
          on campaign.id = campaign_contact.campaign_id
        join troll_tokens
          on to_tsvector(troll_tokens.config, message.text) @@ to_tsquery(troll_tokens.config, troll_tokens.token)
        where true
          and campaign.organization_id = get_trollbot_matches.organization_id
          and message.created_at >= now() - get_trollbot_matches.troll_interval
          and is_from_contact = false;
    end;
    $$ language plpgsql stable security definer set search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    create or replace function public.get_trollbot_matches (organization_id integer, troll_interval interval)
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
          message.id as message_id,
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
          campaign.organization_id = get_trollbot_matches.organization_id
          and message.created_at > now() - get_trollbot_matches.troll_interval
          and is_from_contact = false
          and to_tsvector(text) @@ v_troll_trigger;
    end;
    $$ language plpgsql stable security definer set search_path = "public";
  `);
};
