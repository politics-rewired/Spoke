exports.up = function up(knex) {
  return knex.schema.raw(
    `
      create or replace view sendable_campaigns as (
        select id, title, organization_id, limit_assignment_to_teams, autosend_status, is_autoassign_enabled
        from campaign
        where is_started and not is_archived
      );

      create or replace view assignable_campaigns as (
        select id, title, organization_id, limit_assignment_to_teams, autosend_status
        from sendable_campaigns
        where is_autoassign_enabled
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

      create or replace view autosend_campaigns_to_send as (
        select *
        from sendable_campaigns
        where
          exists ( -- assignable contacts are valid for both autoassign and autosending
            select 1
            from assignable_needs_message
            where campaign_id = sendable_campaigns.id
          )
          and not exists (
            select 1
            from campaign
            where campaign.id = sendable_campaigns.id
              and now() > date_trunc('day', (due_by + interval '24 hours') at time zone campaign.timezone)
          )
          and autosend_status = 'sending'
      );
    `
  );
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `
      drop view autosend_campaigns_to_send;
      drop view assignable_campaigns_with_needs_reply;
      drop view assignable_campaigns_with_needs_message;
      drop view assignable_campaigns;
      drop view sendable_campaigns;

      create or replace view assignable_campaigns as (
        select id, title, organization_id, limit_assignment_to_teams, autosend_status
        from campaign
        where is_started = true
          and is_archived = false
          and is_autoassign_enabled = true
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
    `
  );
};
