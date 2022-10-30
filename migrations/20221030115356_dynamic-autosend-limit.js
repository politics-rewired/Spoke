/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function up(knex) {
  return knex.schema.raw(`
    drop view campaign cascade;

    alter table all_campaign drop column autosend_limit_max_contact_id;

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
        messaging_service_sid,
        autosend_limit
      from all_campaign
      where is_template = false;

      create or replace view assignable_campaigns as (
        select id, title, organization_id, limit_assignment_to_teams
        from campaign
        where is_started = true
          and is_archived = false
          and is_autoassign_enabled = true
      );

      create or replace view assignable_campaign_contacts as (
        select
          campaign_contact.id, campaign_contact.campaign_id,
          campaign_contact.message_status, campaign.texting_hours_end,
          campaign_contact.timezone::text as contact_timezone
        from campaign_contact
        join campaign on campaign_contact.campaign_id = campaign.id
        where assignment_id is null
          and is_opted_out = false
          and archived = false
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

      create or replace view assignable_campaigns_with_needs_reply as (
        select *
        from assignable_campaigns
        where exists (
          select 1
          from assignable_needs_reply
          where campaign_id = assignable_campaigns.id
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

      create or replace view public.missing_external_sync_question_response_configuration as
        select
          all_values.*,
          external_system.id as system_id
        from (
          select
            istep.campaign_id,
            istep.parent_interaction_id as interaction_step_id,
            istep.answer_option as value,
            exists (
              select 1
              from public.question_response as istep_qr
              where
                istep_qr.interaction_step_id = istep.parent_interaction_id
                and istep_qr.value = istep.answer_option
            ) as is_required
          from public.interaction_step istep
          where istep.parent_interaction_id is not null
          union
          select
            qr_istep.campaign_id,
            qr.interaction_step_id,
            qr.value,
            true as is_required
          from public.question_response as qr
          join public.interaction_step qr_istep on qr_istep.id = qr.interaction_step_id
        ) all_values
        join campaign on campaign.id = all_values.campaign_id
        join external_system
          on external_system.organization_id = campaign.organization_id
        where
          not exists (
            select 1
            from public.all_external_sync_question_response_configuration aqrc
            where
              all_values.campaign_id = aqrc.campaign_id
              and external_system.id = aqrc.system_id
              and all_values.interaction_step_id = aqrc.interaction_step_id
              and all_values.value = aqrc.question_response_value
          );

      create view public.external_sync_question_response_configuration as
        select
          aqrc.id::text as compound_id,
          aqrc.campaign_id,
          aqrc.system_id,
          aqrc.interaction_step_id,
          aqrc.question_response_value,
          aqrc.created_at,
          aqrc.updated_at,
          not exists (
            select 1 from public.external_sync_config_question_response_response_option qrro
            where qrro.question_response_config_id = aqrc.id
            union
            select 1 from public.external_sync_config_question_response_activist_code qrac
            where qrac.question_response_config_id = aqrc.id
            union
            select 1 from public.external_sync_config_question_response_result_code qrrc
            where qrrc.question_response_config_id = aqrc.id
          ) as is_empty,
          exists (
            select 1 from public.external_sync_config_question_response_response_option qrro
            join external_survey_question_response_option
              on external_survey_question_response_option.id = qrro.external_response_option_id
            join external_survey_question
              on external_survey_question.id = external_survey_question_response_option.external_survey_question_id
            where
              qrro.question_response_config_id = aqrc.id
              and external_survey_question.status <> 'active'
  
            union
  
            select 1 from public.external_sync_config_question_response_activist_code qrac
            join external_activist_code
              on external_activist_code.id = qrac.external_activist_code_id
            where
              qrac.question_response_config_id = aqrc.id
              and external_activist_code.status <> 'active'
          ) as includes_not_active,
          false as is_missing,
          false as is_required
        from public.all_external_sync_question_response_configuration aqrc
        union
        select
          missing.value || '|' || missing.interaction_step_id || '|' || missing.campaign_id as compound_id,
          missing.campaign_id,
          missing.system_id as system_id,
          missing.interaction_step_id,
          missing.value as question_response_value,
          null as created_at,
          null as updated_at,
          true as is_empty,
          false as includes_not_active,
          true as is_missing,
          missing.is_required
        from public.missing_external_sync_question_response_configuration missing
      ;

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
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table all_campaign
      add column autosend_limit_max_contact_id int,
      add constraint all_campaign_autosend_limit_max_contact_id_foreign
        foreign key (autosend_limit_max_contact_id) references campaign_contact(id);

    update all_campaign
    set autosend_limit_max_contact_id = (
      select max(id)
      from (
        select id
        from campaign_contact
        where true
          and campaign_id = all_campaign.id
          and archived = false
        order by id asc
        limit all_campaign.autosend_limit
      ) campaign_contact_ids
    )
    where autosend_limit is not null;

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
        messaging_service_sid,
        autosend_limit,
        autosend_limit_max_contact_id
      from all_campaign
      where is_template = false;
  `);
};
