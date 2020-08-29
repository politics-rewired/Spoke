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

    alter table public.all_question_response
      add constraint interaction_step_id_fk foreign key(interaction_step_id) references public.interaction_step(id);

    create unique index all_question_response_value_interaction_step_idx
      on public.all_question_response(value, interaction_step_id);

    -- Question Responses
    create table public.all_external_sync_question_response_configuration (
      campaign_id integer not null references public.campaign(id),
      interaction_step_id integer not null,
      question_response_value text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      
      constraint interaction_step_value_fk foreign key (question_response_value, interaction_step_id)
        references public.all_question_response(value, interaction_step_id),
      primary key (question_response_value, interaction_step_id, campaign_id)
    );

    create trigger _500_external_sync_question_response_configuration_updated_at
      before update
      on public.all_external_sync_question_response_configuration
      for each row
      execute procedure universal_updated_at();

    create table public.external_sync_config_question_response_result_code (
      campaign_id integer not null,
      interaction_step_id integer not null,
      question_response_value text not null,
      result_code_system_id uuid not null,
      result_code_external_id integer not null,

      primary key (question_response_value, interaction_step_id, campaign_id),
      constraint sync_config_fk foreign key (question_response_value, interaction_step_id, campaign_id)
        references public.all_external_sync_question_response_configuration(question_response_value, interaction_step_id, campaign_id),
      constraint result_code_fk foreign key (result_code_external_id, result_code_system_id)
        references public.external_result_code(external_id, system_id)
    );

    create table public.external_sync_config_question_response_activist_code (
      campaign_id integer not null,
      interaction_step_id integer not null,
      question_response_value text not null,
      activist_code_system_id uuid not null,
      activist_code_external_id integer not null,

      primary key (question_response_value, interaction_step_id, campaign_id),
      constraint sync_config_fk foreign key (question_response_value, interaction_step_id, campaign_id)
        references public.all_external_sync_question_response_configuration(question_response_value, interaction_step_id, campaign_id),
      constraint activist_code_fk foreign key (activist_code_external_id, activist_code_system_id)
        references public.external_activist_code(external_id, system_id)
    );

    create table public.external_sync_config_question_response_response_option (
      campaign_id integer not null,
      interaction_step_id integer not null,
      question_response_value text not null,
      response_option_system_id uuid not null,
      response_option_question_id integer not null,
      response_option_external_id integer not null,

      primary key (question_response_value, interaction_step_id, campaign_id),
      constraint sync_config_fk foreign key (question_response_value, interaction_step_id, campaign_id)
        references public.all_external_sync_question_response_configuration(question_response_value, interaction_step_id, campaign_id),
      constraint activist_code_fk foreign key (response_option_external_id, response_option_question_id, response_option_system_id)
        references public.external_survey_question_response_option(external_id, external_survey_question_id, system_id)
    );

    create view public.external_sync_config_question_response_targets as
      select
        'response_option' as target_type,
        qrro.question_response_value || '|' || qrro.interaction_step_id || '|' || qrro.campaign_id as config_id,
        ro.system_id || '|' || ro.external_id as target_id,
        qrro.campaign_id,
        qrro.interaction_step_id,
        qrro.question_response_value,
        ro.external_survey_question_id,
        ro.system_id,
        ro.external_id,
        null as type,
        ro.name,
        ro.medium_name,
        ro.short_name,
        null as description,
        null as script_question,
        null as status,
        ro.created_at,
        ro.updated_at
      from public.external_sync_config_question_response_response_option qrro
      join public.external_survey_question_response_option ro
        on qrro.response_option_external_id = ro.external_id
          and qrro.response_option_question_id = ro.external_survey_question_id
          and qrro.response_option_system_id = ro.system_id
      union
      select
        'activist_code' as target_type,
        qrac.question_response_value || '|' || qrac.interaction_step_id || '|' || qrac.campaign_id as config_id,
        ac.system_id || '|' || ac.external_id as target_id,
        qrac.campaign_id,
        qrac.interaction_step_id,
        qrac.question_response_value,
        null as external_survey_question_id,
        ac.system_id,
        ac.external_id,
        ac.type,
        ac.name,
        ac.medium_name,
        ac.short_name,
        ac.description,
        ac.script_question,
        ac.status,
        ac.created_at,
        ac.updated_at
      from public.external_sync_config_question_response_activist_code qrac
      join public.external_activist_code ac
        on qrac.activist_code_external_id = ac.external_id
          and qrac.activist_code_system_id = ac.system_id
      union
      select
        'result_code' as target_type,
        qrrc.question_response_value || '|' || qrrc.interaction_step_id || '|' || qrrc.campaign_id as config_id,
        rc.system_id || '|' || rc.external_id as target_id,
        qrrc.campaign_id,
        qrrc.interaction_step_id,
        qrrc.question_response_value,
        null as external_survey_question_id,
        rc.system_id,
        rc.external_id,
        null as type,
        rc.name,
        rc.medium_name,
        rc.short_name,
        null as description,
        null as script_question,
        null as status,
        rc.created_at,
        rc.updated_at
      from public.external_sync_config_question_response_result_code qrrc
      join public.external_result_code rc
        on qrrc.result_code_external_id = rc.external_id
          and qrrc.result_code_system_id = rc.system_id
      ;

    create view public.missing_external_sync_question_response_configuration as
      select *
      from (
        select
          istep.campaign_id,
          istep.parent_interaction_id as interaction_step_id,
          istep.answer_option as value,
          exists (
            select 1
            from public.all_question_response as istep_qr
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
        from public.all_question_response as qr
        join public.interaction_step qr_istep on qr_istep.id = qr.interaction_step_id
      ) all_values
      where
        not exists (
          select 1
          from public.all_external_sync_question_response_configuration aqrc
          where
            all_values.campaign_id = aqrc.campaign_id
            and all_values.interaction_step_id = aqrc.interaction_step_id
            and all_values.value = aqrc.question_response_value
        );

    create view public.external_sync_question_response_configuration as
      select
        aqrc.question_response_value || '|' || aqrc.interaction_step_id || '|' || aqrc.campaign_id as compound_id,
        aqrc.*,
        not exists (
          select 1 from public.external_sync_config_question_response_targets qrt
          where
            qrt.campaign_id = aqrc.campaign_id
            and qrt.interaction_step_id = aqrc.interaction_step_id
            and qrt.question_response_value = aqrc.question_response_value
        ) as is_empty,
        false as is_missing,
        false as is_required
      from public.all_external_sync_question_response_configuration aqrc
      union
      select
        missing.value || '|' || missing.interaction_step_id || '|' || missing.campaign_id as compound_id,
        missing.campaign_id,
        missing.interaction_step_id,
        missing.value as question_response_value,
        null as created_at,
        null as updated_at,
        true as is_empty,
        true as is_missing,
        missing.is_required
      from public.missing_external_sync_question_response_configuration missing
    ;

    -- Tags
    create table public.all_external_sync_tag_configuration (
      system_id uuid not null references public.external_system(id),
      tag_id integer not null references public.all_tag(id),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      primary key (tag_id, system_id)
    );

    create trigger _500_external_sync_tag_configuration_updated_at
      before update
      on public.all_external_sync_tag_configuration
      for each row
      execute procedure universal_updated_at();

    create table public.external_sync_config_tag_result_code (
      system_id uuid not null,
      tag_id integer not null,
      result_code_external_id integer not null,

      primary key (tag_id, system_id),
      constraint sync_config_fk foreign key (tag_id, system_id)
        references public.all_external_sync_tag_configuration(tag_id, system_id),
      constraint result_code_system_fk foreign key (result_code_external_id, system_id)
        references public.external_result_code(external_id, system_id)
    );

    create table public.external_sync_config_tag_activist_code (
      system_id uuid not null,
      tag_id integer not null,
      activist_code_external_id integer not null,

      primary key (tag_id, system_id),
      constraint sync_config_fk foreign key (tag_id, system_id)
        references public.all_external_sync_tag_configuration(tag_id, system_id),
      constraint activist_code_system_fk foreign key (activist_code_external_id, system_id)
        references public.external_activist_code(external_id, system_id)
    );

    create table public.external_sync_config_tag_survey_question_response_option (
      system_id uuid not null,
      tag_id integer not null,
      response_option_question_id integer not null,
      response_option_external_id integer not null,

      primary key (tag_id, system_id),
      constraint sync_config_fk foreign key (tag_id, system_id)
        references public.all_external_sync_tag_configuration(tag_id, system_id),
      constraint response_option_system_fk foreign key (response_option_external_id, response_option_question_id, system_id)
        references public.external_survey_question_response_option(external_id, external_survey_question_id, system_id)
    );

    create view public.external_sync_config_tag_targets as
      select
        tro.tag_id || '|' || tro.system_id as compound_id,
        tro.system_id,
        tro.tag_id,
        ro.external_survey_question_id,
        ro.external_id,
        null as type,
        ro.name,
        ro.medium_name,
        ro.short_name,
        null as description,
        null as script_question,
        null as status,
        ro.created_at,
        ro.updated_at
      from public.external_sync_config_tag_survey_question_response_option tro
      join public.external_survey_question_response_option ro
        on tro.response_option_external_id = ro.external_id
          and tro.response_option_question_id = ro.external_survey_question_id
          and tro.system_id = ro.system_id
      union
      select
        tac.tag_id || '|' || tac.system_id as compound_id,
        tac.system_id,
        tac.tag_id,
        null as external_survey_question_id,
        ac.external_id,
        ac.type,
        ac.name,
        ac.medium_name,
        ac.short_name,
        ac.description,
        ac.script_question,
        ac.status,
        ac.created_at,
        ac.updated_at
      from public.external_sync_config_tag_activist_code tac
      join public.external_activist_code ac
        on tac.activist_code_external_id = ac.external_id
          and tac.system_id = ac.system_id
      union
      select
        trc.tag_id || '|' || trc.system_id as compound_id,
        trc.system_id,
        trc.tag_id,
        null as external_survey_question_id,
        rc.external_id,
        null as type,
        rc.name,
        rc.medium_name,
        rc.short_name,
        null as description,
        null as script_question,
        null as status,
        rc.created_at,
        rc.updated_at
      from public.external_sync_config_tag_result_code trc
      join public.external_result_code rc
        on trc.result_code_external_id = rc.external_id
          and trc.system_id = rc.system_id
      ;

    create view public.missing_external_sync_tag_configuration as
      select
        es.organization_id,
        es.id as system_id,
        tag.id as tag_id,
        camp.id as campaign_id,
        exists (
          select 1
          from public.campaign_contact_tag cct
          join public.campaign_contact cc
            on cc.id = cct.campaign_contact_id
          where
            cct.tag_id = tag.id
            and cc.campaign_id = camp.id
        ) as is_required
      from public.external_system es
      join public.tag tag on tag.organization_id = es.organization_id
      left join public.campaign camp on camp.external_system_id = es.id
      where
        not exists (
          select 1
          from public.all_external_sync_tag_configuration atc
          where
            camp.external_system_id = atc.system_id
            and tag.id = atc.tag_id
        );

    create view public.external_sync_tag_configuration as
      select
        atc.tag_id || '|' || atc.system_id as compound_id,
        atc.*,
        null as campaign_id,
        not exists (
          select 1 from public.external_sync_config_tag_targets tt
          where
            tt.system_id = atc.system_id
            and tt.tag_id = atc.tag_id
        ) as is_empty,
        false as is_missing,
        false as is_required
      from public.all_external_sync_tag_configuration atc
      union
      select
        missing.tag_id || '|' || missing.system_id as compound_id,
        missing.system_id,
        missing.tag_id,
        null as created_at,
        null as updated_at,
        missing.campaign_id,
        true as is_empty,
        true as is_missing,
        missing.is_required
      from public.missing_external_sync_tag_configuration missing
    ;
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    drop view public.external_sync_tag_configuration;
    drop view public.missing_external_sync_tag_configuration;
    drop view public.external_sync_config_tag_targets;
    drop table public.external_sync_config_tag_survey_question_response_option;
    drop table public.external_sync_config_tag_activist_code;
    drop table public.external_sync_config_tag_result_code;
    drop table public.all_external_sync_tag_configuration;

    drop view public.external_sync_question_response_configuration;
    drop view public.missing_external_sync_question_response_configuration;
    drop view public.external_sync_config_question_response_targets;
    drop table public.external_sync_config_question_response_response_option;
    drop table public.external_sync_config_question_response_activist_code;
    drop table public.external_sync_config_question_response_result_code;
    drop table public.all_external_sync_question_response_configuration;

    alter table public.all_question_response drop constraint interaction_step_id_fk;
    drop index all_question_response_value_interaction_step_idx;

    drop function tg_campaign_check_exteral_system_id() cascade;
    alter table public.campaign drop column external_system_id cascade;
  `);
};