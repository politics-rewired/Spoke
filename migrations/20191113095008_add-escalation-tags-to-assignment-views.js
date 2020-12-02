exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace view assignable_campaign_contacts_with_escalation_tags as (
      select
        campaign_contact.id,
        campaign_contact.campaign_id,
        campaign_contact.message_status,
        campaign_contact.timezone::text as contact_timezone,
        (
          select array_agg(tag.id)
          from campaign_contact_tag
          join tag on campaign_contact_tag.tag_id = tag.id
          where campaign_contact_tag.campaign_contact_id = campaign_contact.id
           and tag.is_assignable = false
        )  as applied_escalation_tags
      from campaign_contact
      where assignment_id is null
        and is_opted_out = false
        and exists (
          select 1
          from campaign_contact_tag
          join tag on campaign_contact_tag.tag_id = tag.id
          where tag.is_assignable = false
            and campaign_contact_tag.campaign_contact_id = campaign_contact.id
        )
    );

    create or replace view assignable_needs_reply_with_escalation_tags as (
      select acc.id, acc.campaign_id, acc.message_status, acc.applied_escalation_tags
      from assignable_campaign_contacts_with_escalation_tags as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsResponse'
        and (
            ( acc.contact_timezone is null
              and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
              and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
            )
          or 
            ( campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '2 minutes')
              and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
            )
        )
    );
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop view assignable_needs_reply_with_escalation_tags;
    drop view assignable_campaign_contacts_with_escalation_tags;
  `);
};
