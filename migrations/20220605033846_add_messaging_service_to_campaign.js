exports.up = function up(knex) {
  return knex.schema
    .alterTable("all_campaign", (table) => {
      table.text("messaging_service_sid");

      table
        .foreign("messaging_service_sid")
        .references("messaging_service.messaging_service_sid");
    })
    .then(() => {
      return knex.schema.raw(`
    create or replace view campaign as
      select
        id,
        organization_id,
        title,
        description,
        is_started,
        due_by,
        created_at,
        is_archived,
        use_dynamic_assignment,
        logo_image_url,
        intro_html,
        primary_color,
        texting_hours_start,
        texting_hours_end,
        timezone,
        creator_id,
        is_autoassign_enabled,
        limit_assignment_to_teams,
        updated_at,
        replies_stale_after_minutes,
        landlines_filtered,
        external_system_id,
        is_approved,
        autosend_status,
        autosend_user_id,
        messaging_service_sid
      from all_campaign
      where is_template = false;
`);
    });
};

exports.down = function down(knex) {
  return knex.schema
    .alterTable("all_campaign", (table) => {
      table.dropColumn("messaging_service_sid");
    })
    .then(() => {
      return knex.schema.raw(`
    create or replace view campaign as
      select
        id,
        organization_id,
        title,
        description,
        is_started,
        due_by,
        created_at,
        is_archived,
        use_dynamic_assignment,
        logo_image_url,
        intro_html,
        primary_color,
        texting_hours_start,
        texting_hours_end,
        timezone,
        creator_id,
        is_autoassign_enabled,
        limit_assignment_to_teams,
        updated_at,
        replies_stale_after_minutes,
        landlines_filtered,
        external_system_id,
        is_approved,
        autosend_status,
        autosend_user_id
      from all_campaign
      where is_template = false;
`);
    });
};
