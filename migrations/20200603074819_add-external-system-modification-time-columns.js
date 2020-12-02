exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table public.external_system add column username text not null default '';
    alter table public.external_system add column created_at timestamptz not null default now();
    alter table public.external_system add column updated_at timestamptz not null default now();
    alter table public.external_system add column synced_at timestamptz null default null;
    alter table public.external_list add column created_at timestamptz not null default now();
    alter table public.external_list add column updated_at timestamptz not null default now();

    create trigger _500_external_system_updated_at
      before update
      on public.external_system
      for each row
      execute procedure universal_updated_at();

    create trigger _500_external_list_updated_at
      before update
      on public.external_list
      for each row
      execute procedure universal_updated_at();

    -- Add 'on conflict ... do update ...' for syncs
    create or replace function "public".insert_saved_lists(payload json, result json, context json) returns void as $$
    begin
      update public.external_system
      set synced_at = now()
      where id = (payload->>'van_system_id')::uuid;

      insert into external_list (external_id, name, description, list_count, door_count, system_id)
      select
        (j->>'saved_list_id')::integer,
        j->>'name',
        j->>'description',
        (j->>'list_count')::integer,
        (j->>'door_count')::integer,
        (j->>'van_system_id')::uuid
      from json_array_elements(result) as j
      on conflict (system_id, external_id)
      do update set
        name = excluded.name,
        description = excluded.description,
        list_count = excluded.list_count,
        door_count = excluded.door_count;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";

    -- Mark job_request as done
    create or replace function "public".mark_loading_job_done(payload json, result json, context json) RETURNS void as $$
    declare
      v_contact_count integer;
    begin
      select count(*)
      from campaign_contact
      where campaign_id = (context->>'campaign_id')::integer
      into v_contact_count;

      update public.job_request
      set
        status = 100,
        result_message = 'Number of contacts loaded from external system: ' || v_contact_count::text
      where id = (context->>'job_request_id')::integer;
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";

    -- Insert job_request record
    create or replace function "public".queue_load_list_into_campaign(campaign_id integer, list_external_id integer) RETURNS void as $$
    declare
      v_job_request_id integer;
    begin
      insert into public.job_request (campaign_id, payload, queue_name, job_type, status)
      values (campaign_id, '', campaign_id::text || ':edit_campaign', 'load_external_list', 0)
      returning id
      into v_job_request_id;

      perform fetch_saved_list(
        list_external_id,
        json_build_object('campaign_id', campaign_id),
        json_build_object(
          'first_name', 'FirstName',
          'last_name', 'LastName',
          'zip', 'ZipOrPostal',
          'custom_fields', json_build_array(
            'CongressionalDistrict', 'StateHouse', 'StateSenate', 'Party',
            'PollingLocation', 'PollingAddress', 'PollingCity', 'Email',
            'phone_id'
          ),
          'cell', 'cell'
        ),
        'insert_van_contact_batch_to_campaign_contact',
        'mark_loading_job_done',
        ('{"job_request_id": "' || v_job_request_id || '", "campaign_id": "' || campaign_id || '"}')::json
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";

    -- Include username with VAN request
    create or replace function "public".queue_refresh_saved_lists(van_system_id uuid) returns void as $$
    declare
      v_username text;
      v_api_key_ref text;
      v_secret graphile_secrets.secrets;
    begin
      select username, api_key_ref
      into v_username, v_api_key_ref
      from external_system
      where id = queue_refresh_saved_lists.van_system_id;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', queue_refresh_saved_lists.van_system_id;
      end if;

      perform graphile_worker.add_job(
        'van-get-saved-lists',
        json_build_object(
          'username', v_username,
          'api_key', json_build_object('__secret', v_api_key_ref),
          'van_system_id', queue_refresh_saved_lists.van_system_id,
          '__after', 'insert_saved_lists'
        )
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";

    -- Include username with VAN request
    create or replace function "public".fetch_saved_list(saved_list_id integer, row_merge json, column_config json, handler text, after text, context json) returns void as $$
    declare
      v_van_system_id uuid;
      v_username text;
      v_api_key_ref text;
    begin
      select system_id
      into v_van_system_id
      from external_list
      where external_list.external_id = fetch_saved_list.saved_list_id;

      select username
      into v_username
      from external_system
      where id = v_van_system_id;

      select get_api_key_ref_from_van_system_with_id(v_van_system_id)
      into v_api_key_ref;

      if v_api_key_ref is null then
      raise 'No API key configured for with id %', v_van_system_id;
      end if;

      perform graphile_worker.add_job(
        'van-fetch-saved-list',
        json_build_object(
          'username', v_username,
          'api_key', json_build_object('__secret', v_api_key_ref),
          'saved_list_id', fetch_saved_list.saved_list_id,
          'row_merge', fetch_saved_list.row_merge,
          'extract_phone_type', 'cell',
          'column_config', fetch_saved_list.column_config,
          'handler', fetch_saved_list.handler,
          '__after', fetch_saved_list.after,
          '__context', fetch_saved_list.context
        )
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";

    create or replace function "public".insert_van_contact_batch_to_campaign_contact(record_list json) returns void as $$
      insert into campaign_contact (campaign_id, first_name, last_name, zip, custom_fields, cell)
      select
        (r ->> 'campaign_id')::integer,
        r ->> 'first_name',
        r ->> 'last_name',
        r ->> 'zip',
        r ->> 'custom_fields',
        r ->> 'cell'
      from json_array_elements(record_list) as r
        where r ->> 'first_name' is not null
          and r ->> 'last_name' is not null
          and r ->> 'cell' is not null
      on conflict (campaign_id, cell) do nothing
    $$ language sql volatile SECURITY definer SET search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    -- Restore function versions from 20200510204235_external_list

    CREATE OR REPLACE FUNCTION "public".insert_van_contact_batch_to_campaign_contact(record_list json) RETURNS void as $$ insert into campaign_contact (campaign_id, first_name, last_name, zip, custom_fields, cell)
    select
      (r ->> 'campaign_id')::integer,
      r ->> 'first_name',
      r ->> 'last_name',
      r ->> 'zip',
      r ->> 'custom_fields',
      r ->> 'cell'
    from json_array_elements(record_list) as r
     $$ language sql volatile SECURITY definer SET search_path = "public";

    CREATE OR REPLACE FUNCTION "public".fetch_saved_list(saved_list_id integer, row_merge json, column_config json, handler text, after text, context json) RETURNS void as $$ declare
      v_van_system_id uuid;
      v_api_key_ref text;
    begin
      select system_id
      from external_list
      where external_list.external_id = fetch_saved_list.saved_list_id
      into v_van_system_id;

      select get_api_key_ref_from_van_system_with_id(v_van_system_id)
      into v_api_key_ref;

      if v_api_key_ref is null then
       raise 'No API key configured for with id %', v_van_system_id;
      end if;

      perform graphile_worker.add_job(
        'van-fetch-saved-list',
        json_build_object(
          'api_key', json_build_object('__secret', v_api_key_ref),
          'saved_list_id', fetch_saved_list.saved_list_id,
          'row_merge', fetch_saved_list.row_merge,
          'extract_phone_type', 'cell',
          'column_config', fetch_saved_list.column_config,
          'handler', fetch_saved_list.handler,
          'first_n_rows', 10,
          '__after', fetch_saved_list.after,
          '__context', fetch_saved_list.context
        )
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";

    CREATE OR REPLACE FUNCTION "public".queue_refresh_saved_lists(van_system_id uuid) RETURNS void as $$ declare
      v_api_key_ref text;
      v_secret graphile_secrets.secrets;
    begin
      select api_key_ref
      from external_system
      where id = queue_refresh_saved_lists.van_system_id
      into v_api_key_ref;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', queue_refresh_saved_lists.van_system_id;
      end if;

      perform graphile_worker.add_job(
        'van-get-saved-lists',
        json_build_object(
          'api_key', json_build_object('__secret', v_api_key_ref),
          'van_system_id', queue_refresh_saved_lists.van_system_id,
          '__after', 'insert_saved_lists'
        )
      );
    end;
     $$ language plpgsql volatile SECURITY definer SET search_path = "public";

    CREATE OR REPLACE FUNCTION "public".queue_load_list_into_campaign(campaign_id integer, list_external_id integer) RETURNS void as $$ select fetch_saved_list(
      list_external_id,
      json_build_object('campaign_id', campaign_id),
      json_build_object(
        'first_name', 'FirstName',
        'last_name', 'LastName',
        'zip', 'ZipOrPostal',
        'custom_fields', json_build_array(
          'CongressionalDistrict', 'StateHouse', 'StateSenate', 'Party',
          'PollingLocation', 'PollingAddress', 'PollingCity', 'Email',
          'phone_id'
        ),
        'cell', 'cell'
      ),
      'insert_van_contact_batch_to_campaign_contact',
      'mark_loading_job_done',
      null::json
    )
     $$ language sql volatile SECURITY definer SET search_path = "public";

    CREATE OR REPLACE FUNCTION "public".mark_loading_job_done(payload json, result json, context json) RETURNS void as $$ select 1
     $$ language sql volatile SECURITY definer SET search_path = "public";

    CREATE OR REPLACE FUNCTION "public".insert_saved_lists(payload json, result json, context json) RETURNS void as $$ insert into external_list
      (external_id, name, description, list_count, door_count, system_id)
    select 
      (j->>'saved_list_id')::integer,
      j->>'name',
      j->>'description',
      (j->>'list_count')::integer,
      (j->>'door_count')::integer,
      (j->>'van_system_id')::uuid
    from json_array_elements(result) as j
    $$ language sql volatile SECURITY definer SET search_path = "public";

    -- Must drop the triggers manually; 'drop column ... cascade' will not work
    drop trigger _500_external_list_updated_at on public.external_list;
    drop trigger _500_external_system_updated_at on public.external_system;

    alter table public.external_list drop column updated_at;
    alter table public.external_list drop column created_at;
    alter table public.external_system drop column synced_at;
    alter table public.external_system drop column updated_at;
    alter table public.external_system drop column created_at;
    alter table public.external_system drop column username;
  `);
};
