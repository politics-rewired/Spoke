exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table campaign rename to all_campaign;

    alter table all_campaign add column is_template boolean not null default false;

    create view campaign as
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

    create or replace view assignable_campaigns as (
      select id, title, organization_id, limit_assignment_to_teams
      from campaign
      where is_started = true
        and is_archived = false
        and is_autoassign_enabled = true
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
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    create or replace view assignable_campaign_contacts as (
      select
        campaign_contact.id, campaign_contact.campaign_id,
        campaign_contact.message_status, all_campaign.texting_hours_end,
        campaign_contact.timezone::text as contact_timezone
      from campaign_contact
      join all_campaign on campaign_contact.campaign_id = all_campaign.id
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
        join all_campaign on all_campaign.id = all_values.campaign_id
        join external_system
          on external_system.organization_id = all_campaign.organization_id
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

    create or replace view assignable_needs_reply_with_escalation_tags as (
      select acc.id, acc.campaign_id, acc.message_status, acc.applied_escalation_tags
      from assignable_campaign_contacts_with_escalation_tags as acc
      join all_campaign on all_campaign.id = acc.campaign_id
      where message_status = 'needsResponse'
        and (
            ( acc.contact_timezone is null
              and extract(hour from CURRENT_TIMESTAMP at time zone all_campaign.timezone) < all_campaign.texting_hours_end
              and extract(hour from CURRENT_TIMESTAMP at time zone all_campaign.timezone) >= all_campaign.texting_hours_start
            )
          or
            ( all_campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '2 minutes')
              and all_campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
            )
        )
    );

    create or replace view assignable_needs_reply as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      join all_campaign on all_campaign.id = acc.campaign_id
      where message_status = 'needsResponse'
        and (
            ( acc.contact_timezone is null
              and extract(hour from CURRENT_TIMESTAMP at time zone all_campaign.timezone) < all_campaign.texting_hours_end
              and extract(hour from CURRENT_TIMESTAMP at time zone all_campaign.timezone) >= all_campaign.texting_hours_start
            )
          or 
            ( all_campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '2 minutes')
              and all_campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
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
          from all_campaign
          where all_campaign.id = assignable_campaigns.id
            and now() > date_trunc('day', (due_by + interval '24 hours') at time zone all_campaign.timezone)
        )
    );

    create or replace view assignable_needs_message as (
      select acc.id, acc.campaign_id, acc.message_status
      from assignable_campaign_contacts as acc
      join all_campaign on all_campaign.id = acc.campaign_id
      where message_status = 'needsMessage'
        and (
            ( acc.contact_timezone is null
              and extract(hour from CURRENT_TIMESTAMP at time zone all_campaign.timezone) < all_campaign.texting_hours_end
              and extract(hour from CURRENT_TIMESTAMP at time zone all_campaign.timezone) >= all_campaign.texting_hours_start
            )
          or
            ( all_campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone) + interval '10 minutes')
              and all_campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone acc.contact_timezone))
            )
        )
    );

    create or replace view assignable_campaigns as (
      select id, title, organization_id, limit_assignment_to_teams
      from all_campaign
      where is_started = true
        and is_archived = false
        and is_autoassign_enabled = true
    );

    drop view campaign;

    alter table all_campaign drop column is_template;
    alter table all_campaign rename to campaign;
  `);
};
