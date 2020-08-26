exports.up = function(knex) {
  // Using internal IDs may be preferable to composite primary keys

  // return knex.schema.raw(`
  //   create table public.external_survey_question (
  //     id uuid not null default uuid_generate_v1mc(),
  //     system_id uuid not null references external_system(id),
  //     external_id integer nul null,
  //     primary key (id),
  //     unique (system_id, external_id)
  //   );

  //   create table public.external_survey_question_response_option (
  //     id uuid not null default uuid_generate_v1mc(),
  //     external_survey_question_id uuid not null references external_survey_question(id),
  //     system_id uuid not null references external_s,
  //     primary key (id),
  //   )
  // `);

  return knex.schema.raw(`
    create type external_question_type as enum ('active', 'archived', 'inactive');

    alter table public.external_system add constraint external_system_pkey primary key (id);

    create table public.external_survey_question (
      system_id uuid not null references external_system(id),
      external_id integer not null,
      type text,
      cycle integer,
      name text,
      medium_name text,
      short_name text,
      script_question text,
      status external_question_type,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (external_id, system_id)
    );

    create trigger _500_external_survey_question_updated_at
      before update
      on public.external_survey_question
      for each row
      execute procedure universal_updated_at();

    create table public.external_survey_question_response_option (
      system_id uuid not null references external_system(id),
      external_survey_question_id integer not null,
      external_id integer not null,
      name text,
      medium_name text,
      short_name text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (external_id, external_survey_question_id, system_id),
      foreign key (external_survey_question_id, system_id) references external_survey_question(external_id, system_id)
    );

    create trigger _500_external_survey_question_response_option_updated_at
      before update
      on public.external_survey_question_response_option
      for each row
      execute procedure universal_updated_at();

    create function public.insert_van_survey_questions(payload json, result json, context json) returns void as $$
    begin
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
        (j->>'status')::external_question_type
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
      ;

      insert into external_survey_question_response_option
        (system_id, external_survey_question_id, external_id, name, medium_name, short_name)
      select
        system_id,
        survey_question_id,
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
      on conflict (system_id, external_survey_question_id, external_id)
      do update set
        name = EXCLUDED.name,
        medium_name = EXCLUDED.medium_name,
        short_name = EXCLUDED.short_name
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
        )
      );
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop function public.queue_refresh_van_survey_questions(uuid);
    drop function public.insert_van_survey_questions(json, json, json);
    drop table public.external_survey_question_response_option;
    drop table public.external_survey_question;
    alter table public.external_system drop constraint external_system_pkey;
    drop type external_question_type;
  `);
};
