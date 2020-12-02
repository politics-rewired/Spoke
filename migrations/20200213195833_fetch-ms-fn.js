exports.up = function up(knex) {
  return knex.schema.raw(`
    create function get_messaging_service_for_campaign_contact_in_organization(campaign_contact_id integer, organization_id integer)
    returns messaging_service
    as $$
      select *
      from messaging_service
      where exists (
        select 1
        from messaging_service_stick
        where exists (
            select 1
            from campaign_contact
            where messaging_service_stick.cell = campaign_contact.cell
              and campaign_contact.id = get_messaging_service_for_campaign_contact_in_organization.campaign_contact_id
          )
          and organization_id = get_messaging_service_for_campaign_contact_in_organization.organization_id
          and messaging_service_stick.messaging_service_sid = messaging_service.messaging_service_sid
      )
    $$ language sql strict stable;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `drop function get_messaging_service_for_campaign_contact_in_organization`
  );
};
