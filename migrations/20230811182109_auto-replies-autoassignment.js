/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function up(knex) {
  return knex.schema.raw(`
    drop view assignable_campaign_contacts cascade;

    create or replace view assignable_campaign_contacts as (
      select
        campaign_contact.id, campaign_contact.campaign_id,
        campaign_contact.message_status, campaign.texting_hours_end,
        campaign_contact.timezone::text as contact_timezone
      from campaign_contact
      join campaign on campaign_contact.campaign_id = campaign.id
      where assignment_id is null
        and auto_reply_eligible = false
        and is_opted_out = false
        and archived = false
        and not exists (
          select 1
          from campaign_contact_tag
          join tag on campaign_contact_tag.tag_id = tag.id
          where tag.is_assignable = false
            and campaign_contact_tag.campaign_contact_id = campaign_contact.id
        )
    );

    create or replace view assignable_needs_message as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsMessage'
      and (
        ( 
          acc.contact_timezone is null
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
        )
        or
        ( 
          campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
          and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
        )
      )
    );

    create or replace view assignable_needs_reply as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsResponse'
      and (
        ( 
          acc.contact_timezone is null
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
        )
        or
        ( 
          campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
          and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
        )
      )
    );

    create or replace view assignable_needs_reply_with_escalation_tags as (
      select acc.id, acc.campaign_id, acc.message_status, acc.applied_escalation_tags
      from assignable_campaign_contacts_with_escalation_tags as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsResponse'
      and (
        ( 
          acc.contact_timezone is null
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
        )
        or
        ( 
          campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
          and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
        )
      )
    );

    create or replace view assignable_campaigns_with_needs_message as (
      select *
      from assignable_campaigns
      where
        exists (
          select 1
          from assignable_needs_message
          where campaign_id = assignable_campaigns.id
        )
        and not exists (
          select 1
          from campaign
          where campaign.id = assignable_campaigns.id
            and now() > date_trunc('day', (due_by + interval '24 hours') at time zone campaign.timezone)
        )
        and autosend_status <> 'sending'
    );

    create or replace view assignable_campaigns_with_needs_reply as (
      select *
      from assignable_campaigns
      where exists (
        select 1
        from assignable_needs_reply
        where campaign_id = assignable_campaigns.id
      )
    );

    drop index todos_partial_idx;
    create index todos_partial_idx on campaign_contact (campaign_id, assignment_id, message_status, is_opted_out, auto_reply_eligible) where (archived = false);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
  return knex.schema.raw(`
    drop view assignable_campaign_contacts cascade;

    create or replace view assignable_campaign_contacts as (
      select
        campaign_contact.id, campaign_contact.campaign_id,
        campaign_contact.message_status, campaign.texting_hours_end,
        campaign_contact.timezone::text as contact_timezone
      from campaign_contact
      join campaign on campaign_contact.campaign_id = campaign.id
      where assignment_id is null
        and is_opted_out = false
        and archived = false
        and not exists (
          select 1
          from campaign_contact_tag
          join tag on campaign_contact_tag.tag_id = tag.id
          where tag.is_assignable = false
            and campaign_contact_tag.campaign_contact_id = campaign_contact.id
        )
    );

    create or replace view assignable_needs_message as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsMessage'
      and (
        ( 
          acc.contact_timezone is null
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
        )
        or
        ( 
          campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
          and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
        )
      )
    );

    create or replace view assignable_needs_reply as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsResponse'
      and (
        ( 
          acc.contact_timezone is null
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
        )
        or
        ( 
          campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
          and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
        )
      )
    );

    create or replace view assignable_needs_reply_with_escalation_tags as (
      select acc.id, acc.campaign_id, acc.message_status, acc.applied_escalation_tags
      from assignable_campaign_contacts_with_escalation_tags as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsResponse'
      and (
        ( 
          acc.contact_timezone is null
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
          and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
        )
        or
        ( 
          campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
          and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
        )
      )
    );

    create or replace view assignable_campaigns_with_needs_message as (
      select *
      from assignable_campaigns
      where
        exists (
          select 1
          from assignable_needs_message
          where campaign_id = assignable_campaigns.id
        )
        and not exists (
          select 1
          from campaign
          where campaign.id = assignable_campaigns.id
            and now() > date_trunc('day', (due_by + interval '24 hours') at time zone campaign.timezone)
        )
        and autosend_status <> 'sending'
    );

    create or replace view assignable_campaigns_with_needs_reply as (
      select *
      from assignable_campaigns
      where exists (
        select 1
        from assignable_needs_reply
        where campaign_id = assignable_campaigns.id
      )
    );

    drop index todos_partial_idx;
    create index todos_partial_idx on campaign_contact (campaign_id, assignment_id, message_status, is_opted_out) where (archived = false);
  `);
};
