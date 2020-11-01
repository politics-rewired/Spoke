exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace view assignable_needs_message as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      join campaign on campaign.id = acc.campaign_id
      where message_status = 'needsMessage'
        and (
            ( acc.contact_timezone is null
              and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
              and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
            )
          or 
            ( campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
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
    `);
};
