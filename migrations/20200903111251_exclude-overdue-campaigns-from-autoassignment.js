
exports.up = function(knex) {
  return knex.schema.raw(`
    create or replace view assignable_campaigns as (
      select id, title, organization_id, limit_assignment_to_teams
      from campaign
      where is_started = true
        and is_archived = false
        and is_autoassign_enabled = true
        and texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone campaign.timezone))
        and now() < date_trunc('day', (due_by + interval '24 hours') at time zone campaign.timezone)
    );
  `)
};

exports.down = function(knex) {
  return knex.schema.raw(`
    create or replace view assignable_campaigns as (
      select id, title, organization_id, limit_assignment_to_teams
      from campaign
      where is_started = true
        and is_archived = false
        and is_autoassign_enabled = true
        and texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone campaign.timezone))
    );
  `)
};
