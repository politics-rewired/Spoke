exports.up = function(knex) {
  return knex.schema.raw(`
    -- Store VAN export job ID
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

    drop function public.queue_load_list_into_campaign(integer, integer);
    drop function public.fetch_saved_list(integer, json, json, text, text, json);

    -- Configurable webhook
    create or replace function "public".fetch_saved_list(saved_list_id integer, row_merge json, column_config json, webhook_url text, handler text, after text, context json) returns void as $$
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
          'webhook_url', fetch_saved_list.webhook_url,
          'handler', fetch_saved_list.handler,
          '__after', fetch_saved_list.after,
          '__context', fetch_saved_list.context
        )
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";


    -- Configurable webhook
    create or replace function "public".queue_load_list_into_campaign(campaign_id integer, list_external_id integer, webhook_base_url text) RETURNS void as $$
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
        webhook_base_url || '/' || v_job_request_id,
        'insert_van_contact_batch_to_campaign_contact',
        'mark_loading_job_done',
        ('{"job_request_id": "' || v_job_request_id || '", "campaign_id": "' || campaign_id || '"}')::json
      );
    end;
    $$ language plpgsql volatile SECURITY definer SET search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop function public.queue_load_list_into_campaign(integer, integer, text);
    drop function public.fetch_saved_list(integer, json, json, text, text, text, json);

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
  `);
};
