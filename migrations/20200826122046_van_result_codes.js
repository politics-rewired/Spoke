exports.up = function(knex) {
  return knex.schema.raw(`
    create table public.external_result_code (
      system_id uuid not null references external_system(id),
      external_id integer not null,
      name text,
      medium_name text,
      short_name text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (external_id, system_id)
    );

    create trigger _500_external_result_code_updated_at
      before update
      on public.external_result_code
      for each row
      execute procedure universal_updated_at();

    create function public.insert_van_result_codes(payload json, result json, context json) returns void as $$
    begin
      insert into external_result_code
        (system_id, external_id, name, medium_name, short_name)
      select
        (j->>'van_system_id')::uuid,
        (j->>'result_code_id')::integer,
        j->>'name',
        j->>'medium_name',
        j->>'short_name'
      from json_array_elements(result) as j
      on conflict (system_id, external_id)
      do update set
        name = EXCLUDED.name,
        medium_name = EXCLUDED.medium_name,
        short_name = EXCLUDED.short_name
      ;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";

    create function public.queue_refresh_van_result_codes(van_system_id uuid) returns void as $$
    declare
      v_api_key_ref text;
      v_secret graphile_secrets.secrets;
    begin
      select api_key_ref
      from external_system
      where id = queue_refresh_van_result_codes.van_system_id
      into v_api_key_ref;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', queue_refresh_van_result_codes.van_system_id;
      end if;

      perform graphile_worker.add_job(
        'van-get-result-codes',
        json_build_object(
          'api_key', json_build_object('__secret', v_api_key_ref),
          'van_system_id', queue_refresh_van_result_codes.van_system_id,
          '__after', 'insert_van_result_codes'
        )
      );
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop function public.queue_refresh_van_result_codes(uuid);
    drop function public.insert_van_result_codes(json, json, json);
    drop table public.external_result_code;
  `);
};
