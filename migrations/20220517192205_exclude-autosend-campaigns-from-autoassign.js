exports.up = function up(knex) {
  return knex.schema
    .raw(
      `
        create or replace view assignable_campaigns as (
          select id, title, organization_id, limit_assignment_to_teams, autosend_status
          from campaign
          where is_started = true
            and is_archived = false
            and is_autoassign_enabled = true
        );
      `
    )
    .then(() =>
      knex.schema.raw(`
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
      `)
    );
};

exports.down = function down(knex) {
  return knex.schema
    .raw(
      `
        create or replace view assignable_campaigns as (
          select id, title, organization_id, limit_assignment_to_teams
          from campaign
          where is_started = true
            and is_archived = false
            and is_autoassign_enabled = true
        );
      `
    )
    .then(() => {
      return knex.schema.raw(`
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
        );
      `);
    });
};
