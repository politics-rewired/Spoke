exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table public.external_system add constraint external_system_pkey primary key (id);

    create table public.external_survey_question (
      id uuid not null default uuid_generate_v1mc(),
      system_id uuid not null references external_system(id),
      external_id integer not null,
      type text,
      cycle integer,
      name text,
      medium_name text,
      short_name text,
      script_question text,
      status text check (status in ('active', 'archived', 'inactive')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (id),
      unique (external_id, system_id)
    );

    create trigger _500_external_survey_question_updated_at
      before update
      on public.external_survey_question
      for each row
      execute procedure universal_updated_at();

    create table public.external_survey_question_response_option (
      id uuid not null default uuid_generate_v1mc(),
      external_survey_question_id uuid not null references external_survey_question(id) on delete cascade,
      external_id integer not null,
      name text,
      medium_name text,
      short_name text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (id),
      unique (external_id, external_survey_question_id)
    );

    create trigger _500_external_survey_question_response_option_updated_at
      before update
      on public.external_survey_question_response_option
      for each row
      execute procedure universal_updated_at();

    -- Upsert in order to preserve existing IDs and their config mappings
    create function public.insert_van_survey_questions(payload json, result json, context json) returns void as $$
    begin
      -- Upsert survey questions, storing the mapping from VAN's ID -> local ID
      with survey_question_mapping as (
        insert into external_survey_question
          (system_id, external_id, type, cycle, name, medium_name, short_name, script_question, status)
        select
          (j->>'van_system_id')::uuid,
          (j->>'survey_question_id')::integer,
          j->>'type',
          (j->>'cycle')::integer,
          j->>'name',
          j->>'medium_name',
          j->>'short_name',
          j->>'script_question',
          (j->>'status')
        from json_array_elements(result) as j
        on conflict (system_id, external_id) 
        do update set
          type = EXCLUDED.type,
          cycle = EXCLUDED.cycle,
          name = EXCLUDED.name,
          medium_name = EXCLUDED.medium_name,
          short_name = EXCLUDED.short_name,
          script_question = EXCLUDED.script_question,
          status = EXCLUDED.status
        returning id, external_id, system_id
      ),

      -- Delete archived survey questions
      flush_survey_questions as (
        delete from external_survey_question
        where
          system_id = (select system_id from survey_question_mapping limit 1)
          and id not in (select id from survey_question_mapping)
      ),

      -- Upsert response options
      response_option_insert_results as (
        insert into external_survey_question_response_option
          (external_survey_question_id, external_id, name, medium_name, short_name)
        select
          survey_question_mapping.id,
          (j->>'survey_question_response_option_id')::integer as external_id,
          j->>'name',
          j->>'medium_name',
          j->>'short_name'
        from (
          select
            (inner_json->>'van_system_id')::uuid as system_id,
            (inner_json->>'survey_question_id')::integer as survey_question_id,
            json_array_elements(inner_json->'responses') as j
          from json_array_elements(result) as inner_json
        ) survey_questions
        join survey_question_mapping
          on survey_question_mapping.external_id = survey_questions.survey_question_id
        on conflict (external_survey_question_id, external_id)
        do update set
          name = EXCLUDED.name,
          medium_name = EXCLUDED.medium_name,
          short_name = EXCLUDED.short_name
        returning id
      )

      -- Delete archived response options
      delete from external_survey_question_response_option
      where
        external_survey_question_id in (select id from survey_question_mapping)
        and id not in (select id from response_option_insert_results)
      ;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";

    create function public.queue_refresh_van_survey_questions(van_system_id uuid) returns void as $$
    declare
      v_api_key_ref text;
      v_secret graphile_secrets.secrets;
    begin
      select api_key_ref
      from external_system
      where id = queue_refresh_van_survey_questions.van_system_id
      into v_api_key_ref;
  
      if v_api_key_ref is null then
        raise 'No API key configured for with id %', queue_refresh_van_survey_questions.van_system_id;
      end if;
  
      perform graphile_worker.add_job(
        'van-get-survey-questions',
        json_build_object(
          'api_key', json_build_object('__secret', v_api_key_ref),
          'van_system_id', queue_refresh_van_survey_questions.van_system_id,
          '__after', 'insert_van_survey_questions'
        ),
        'van-api',
        priority => 0
      );
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop function public.queue_refresh_van_survey_questions(uuid);
    drop function public.insert_van_survey_questions(json, json, json);
    drop table public.external_survey_question_response_option;
    drop table public.external_survey_question;
    alter table public.external_system drop constraint external_system_pkey;
  `);
};
