exports.up = function up(knex) {
  return knex.schema
    .raw(
      `
      create view assignable_campaigns as (
        select id, title, organization_id, limit_assignment_to_teams
        from campaign
        where is_started = true
          and is_archived = false
          and is_autoassign_enabled = true
          and texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone campaign.timezone))
      )`
    )
    .then(() => {
      return knex.schema.raw(`
        create view assignable_campaign_contacts as (
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
        )
    `);
    })
    .then(() => {
      return knex.schema.raw(`
        create view assignable_needs_message as (
          select *
          from assignable_campaign_contacts
          where message_status = 'needsMessage'
        );

        create view assignable_needs_reply as (
          select *
          from assignable_campaign_contacts
          where message_status = 'needsResponse'
        );
    `);
    })
    .then(() => {
      return knex.schema.raw(`
        create view assignable_campaigns_with_needs_message as (
          select *
          from assignable_campaigns
          where exists (
            select 1
            from assignable_needs_message
            where campaign_id = assignable_campaigns.id
          )
        );

        create view assignable_campaigns_with_needs_reply as (
          select *
          from assignable_campaigns
          where exists (
            select 1
            from assignable_needs_reply
            where campaign_id = assignable_campaigns.id
          )
        );
    `);
    });
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop view assignable_campaigns_with_needs_reply;
    drop view assignable_campaigns_with_needs_message;
    drop view assignable_needs_reply;
    drop view assignable_needs_message;
    drop view assignable_campaign_contacts;
    drop view assignable_campaigns;
  `);
};
