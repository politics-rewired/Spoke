exports.up = function (knex) {
  return knex.schema.raw(`
    CREATE OR REPLACE FUNCTION public.get_trollbot_matches(organization_id integer, troll_interval interval) RETURNS TABLE(message_id integer, trigger_token text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
        messages_to_consider as materialized (
          select message.id, text, is_from_contact, campaign_contact_id
          from message
          join campaign_contact
              on campaign_contact.id = message.campaign_contact_id
          join campaign
            on campaign.id = campaign_contact.campaign_id
          where true
            and campaign.organization_id = get_trollbot_matches.organization_id
            and message.created_at >= now() - get_trollbot_matches.troll_interval 
            and message.is_from_contact = false
            -- exclude initial messages
            and exists (
              select 1
              from message earlier_message 
              where earlier_message.campaign_contact_id = message.campaign_contact_id
                and earlier_message.created_at < message.created_at
            )
        ),
        bad_messages as (
          select distinct on (m.id) m.id, mode, text, is_from_contact
          from messages_to_consider m
          join ts_queries on to_tsvector(regconfig_mode(mode), m.text) @@ ts_queries.tsquery
          order by m.id, mode
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
    $$;
  `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    CREATE OR REPLACE FUNCTION public.get_trollbot_matches(organization_id integer, troll_interval interval) RETURNS TABLE(message_id integer, trigger_token text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
    $$;
  `);
};
