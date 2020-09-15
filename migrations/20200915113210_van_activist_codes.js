exports.up = function(knex) {
  return knex.schema.raw(`
    create table public.external_activist_code (
      system_id uuid not null references external_system(id),
      external_id integer not null,
      type text,
      name text,
      medium_name text,
      short_name text,
      description text,
      script_question text,
      status text check (status in ('active', 'archived', 'inactive')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (external_id, system_id)
    );

    create trigger _500_external_activist_code_updated_at
      before update
      on public.external_activist_code
      for each row
      execute procedure universal_updated_at();

    create function public.insert_van_activist_codes(payload json, result json, context json) returns void as $$
    begin
      insert into external_activist_code
        (system_id, external_id, type, name, medium_name, short_name, description, script_question, status)
      select
        (j->>'van_system_id')::uuid,
        (j->>'activist_code_id')::integer,
        j->>'type',
        j->>'name',
        j->>'medium_name',
        j->>'short_name',
        j->>'description',
        j->>'script_question',
        (j->>'status')
      from json_array_elements(result) as j
      on conflict (system_id, external_id)
      do update set
        type = EXCLUDED.type,
        name = EXCLUDED.name,
        medium_name = EXCLUDED.medium_name,
        short_name = EXCLUDED.short_name,
        description = EXCLUDED.description,
        script_question = EXCLUDED.script_question,
        status = EXCLUDED.status
      ;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";

    create function public.queue_refresh_van_activist_codes(van_system_id uuid) returns void as $$
    declare
      v_api_key_ref text;
      v_secret graphile_secrets.secrets;
    begin
      select api_key_ref
      from external_system
      where id = queue_refresh_van_activist_codes.van_system_id
      into v_api_key_ref;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', queue_refresh_van_activist_codes.van_system_id;
      end if;

      perform graphile_worker.add_job(
        'van-get-activist-codes',
        json_build_object(
          'api_key', json_build_object('__secret', v_api_key_ref),
          'van_system_id', queue_refresh_van_activist_codes.van_system_id,
          '__after', 'insert_van_activist_codes'
        )
      );
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop function public.queue_refresh_van_activist_codes(uuid);
    drop function public.insert_van_activist_codes(json, json, json);
    drop table public.external_activist_code;
  `);
};
