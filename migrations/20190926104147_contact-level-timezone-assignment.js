exports.up = function up(knex) {
  return knex.schema.raw(
    /**
     * This adds a a condition that the contact is within certain assignable time zones
     * by overriding this intermediate view
     *
     * it uses texting hours start and end with the contacts local time zone, and falls back
     * to conservative voter contact hours for unknown contacts
     *
     * Then, assignable_needs_message and assignable_needs_reply select from it with
     * their own buffer zones
     *
     * Must use a temporary view to avoid downtime, since you cannot replace (must drop and recreate)
     * a view if its columns change, and assignable_campaign_contacts adds a contact_timezone column
     *
     * assignable_needs_message and assignable_needs_reply must select their columns directly
     * to avoid requiring a drop and recreate (can't add new columns)
     *
     * finally, once it's safe to do so, we remove the time zone constraint from the campaign level view
     */
    `
    create or replace function spoke_tz_to_iso_tz(spoke_tz text) returns text as $$
      select case
        when spoke_tz = '-10_1' then 'Pacific/Honolulu'
        when spoke_tz = '-9_1' then 'America/Anchorage'
        when spoke_tz = '-8_1' then 'America/Los_Angeles'
        when spoke_tz = '-7_1' then 'America/Denver'
        when spoke_tz = '-6_0' then 'America/Chicago'
        when spoke_tz = '-5_1' then 'America/New_York'
        when spoke_tz = '-5_0' then 'America/New_York'
        else null
      end;
    $$ language sql strict immutable;

    create view old_assignable_campaign_contacts as (
      select id, campaign_id, message_status
      from campaign_contact
      where assignment_id is null
        and is_opted_out = false
        and not exists (
          select 1
          from campaign_contact_tag
          join tag on campaign_contact_tag.tag_id = tag.id
          where tag.is_assignable = false
            and campaign_contact_tag.campaign_contact_id = campaign_contact.id
        )
    );

    create or replace view assignable_needs_message as (
      select *
      from old_assignable_campaign_contacts
      where message_status = 'needsMessage'
    );

    create or replace view assignable_needs_reply as (
      select *
      from old_assignable_campaign_contacts
      where message_status = 'needsResponse'
    );

    drop view assignable_campaign_contacts;

    create or replace view assignable_campaign_contacts as (
      select
        campaign_contact.id, campaign_contact.campaign_id,
        campaign_contact.message_status, campaign.texting_hours_end,
        spoke_tz_to_iso_tz(campaign_contact.timezone_offset) as contact_timezone
      from campaign_contact
      join campaign on campaign_contact.campaign_id = campaign.id
      where assignment_id is null
        and is_opted_out = false
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
      where message_status = 'needsMessage'
        and (
          ( acc.contact_timezone is null and extract(hour from CURRENT_TIMESTAMP) < 21 and extract(hour from CURRENT_TIMESTAMP) > 12 )
          or acc.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
        )
    );

    create or replace view assignable_needs_reply as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      where message_status = 'needsResponse'
        and (
          ( acc.contact_timezone is null and extract(hour from CURRENT_TIMESTAMP) < 21 and extract(hour from CURRENT_TIMESTAMP) > 12 )
          or acc.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '2 minutes')
        )
    );

    create or replace view assignable_campaigns as (
      select id, title, organization_id, limit_assignment_to_teams
      from campaign
      where is_started = true
        and is_archived = false
        and is_autoassign_enabled = true
    );

    drop view old_assignable_campaign_contacts;
    `
  );
};

exports.down = function down(knex) {
  return knex.schema.raw(
    /**
     * Bring back campaign restriction
     *
     * Remove contact restriction
     *
     * No need to destroy function / remove column from assignable_contacts
     */
    `
    create or replace view assignable_campaigns as (
      select id, title, organization_id, limit_assignment_to_teams
      from campaign
      where is_started = true
        and is_archived = false
        and is_autoassign_enabled = true
        and texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone campaign.timezone))
    );

    create or replace view assignable_needs_message as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      where message_status = 'needsMessage'
    );

    create or replace view assignable_needs_reply as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      where message_status = 'needsResponse'
    );
    `
  );
};
