exports.up = function(knex) {
  return knex.raw(`
    alter table public.campaign
      add column external_system_id uuid references public.external_system(id);

    create index campaign_external_system_id_index on campaign(external_system_id);

    create function tg_campaign_check_exteral_system_id()
      returns trigger as $$
    declare
      v_system_organization_id integer;
    begin
      select organization_id
      from public.external_system
      where id = NEW.external_system_id
      into v_system_organization_id;

      if NEW.organization_id <> v_system_organization_id
      then
        raise exception 'External system referenced by [external_system_id:%] must belong to the same organization!',
          NEW.external_system_id;
      end if;

      return NEW;
    end;
    $$ language plpgsql;

    create trigger _500_campaign_external_system_id 
      before insert or update on campaign 
      for each row execute procedure tg_campaign_check_exteral_system_id();

    create unique index question_response_interaction_step_campaign_contact_id_idx
      on public.all_question_response(interaction_step_id, campaign_contact_id) where (is_deleted = false);

    -- Question Responses
    create table public.all_external_sync_question_response_configuration (
      id uuid not null default uuid_generate_v1mc(),
      system_id uuid not null references public.external_system(id),
      campaign_id integer not null references public.campaign(id),
      interaction_step_id integer not null references public.interaction_step(id),
      question_response_value text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      primary key (id),
      unique (question_response_value, interaction_step_id, campaign_id, system_id)
    );

    create trigger _500_external_sync_question_response_configuration_updated_at
      before update
      on public.all_external_sync_question_response_configuration
      for each row
      execute procedure universal_updated_at();

    create table public.external_sync_config_question_response_result_code (
      id uuid not null default uuid_generate_v1mc(),
      question_response_config_id uuid not null
        references public.all_external_sync_question_response_configuration(id) on delete cascade,
      external_result_code_id uuid not null
        references public.external_result_code(id) on delete cascade,

      primary key (id)
    );

    create index sync_config_qr_rc_idx
      on public.external_sync_config_question_response_result_code(question_response_config_id);

    create index sync_config_qr_rc_ext_idx
      on public.external_sync_config_question_response_result_code(external_result_code_id);

    create table public.external_sync_config_question_response_activist_code (
      id uuid not null default uuid_generate_v1mc(),
      question_response_config_id uuid not null
        references public.all_external_sync_question_response_configuration(id) on delete cascade,
      external_activist_code_id uuid not null
        references public.external_activist_code(id) on delete cascade,

      primary key (id)
    );

    create index sync_config_qr_ac_idx
      on public.external_sync_config_question_response_activist_code(question_response_config_id);

    create index sync_config_qr_ac_ext_idx
      on public.external_sync_config_question_response_activist_code(external_activist_code_id);

    create table public.external_sync_config_question_response_response_option (
      id uuid not null default uuid_generate_v1mc(),
      question_response_config_id uuid not null
        references public.all_external_sync_question_response_configuration(id) on delete cascade,
      external_response_option_id uuid not null
        references public.external_survey_question_response_option(id) on delete cascade,

      primary key (id)
    );

    create index sync_config_qr_ro_idx
      on public.external_sync_config_question_response_response_option(question_response_config_id);

    create index sync_config_qr_ro_ext_idx
      on public.external_sync_config_question_response_response_option(external_response_option_id);

    create view public.missing_external_sync_question_response_configuration as
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
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    drop view public.external_sync_question_response_configuration;
    drop view public.missing_external_sync_question_response_configuration;
    drop table public.external_sync_config_question_response_response_option;
    drop table public.external_sync_config_question_response_activist_code;
    drop table public.external_sync_config_question_response_result_code;
    drop table public.all_external_sync_question_response_configuration;

    drop index question_response_interaction_step_campaign_contact_id_idx;

    drop function tg_campaign_check_exteral_system_id() cascade;
    alter table public.campaign drop column external_system_id cascade;
  `);
};
