exports.up = function(knex) {
  return knex.schema
    .raw(
      `
      create or replace view assignable_campaign_contacts as (
        select
          campaign_contact.id, campaign_contact.campaign_id,
          campaign_contact.message_status, campaign.texting_hours_end,
          campaign_contact.timezone::text as contact_timezone
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
    )
  `
    )
    .then(() => {
      return knex.schema.alterTable("campaign_contact", table => {
        table.dropColumn("timezone_offset");
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable("campaign_contact", table => {
      table.text("timezone_offset").defaultTo("");
      table.index(
        ["assignment_id", "timezone_offset"],
        "campaign_contact_assignment_id_timezone_offset_index"
      );
    })
    .then(() => {
      return knex.schema.raw(
        `
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
        `
      );
    });
};
