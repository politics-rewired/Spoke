exports.up = function up(knex) {
  return knex.schema.raw(`
    CREATE EXTENSION "uuid-ossp" with schema "public";

    CREATE TABLE "public"."external_system" ();
    ALTER TABLE "public"."external_system" add column id uuid NOT NULL DEFAULT uuid_generate_v1mc();
    ALTER TABLE "public"."external_system" add column name text NOT NULL;
    ALTER TABLE "public"."external_system" add column type text NOT NULL;
    ALTER TABLE "public"."external_system" add column api_key_ref text NOT NULL;
    ALTER TABLE "public"."external_system" add column organization_id integer;
    CREATE TABLE "public"."external_list" ();
    ALTER TABLE "public"."external_list" add column system_id uuid NOT NULL;
    ALTER TABLE "public"."external_list" add column external_id integer NOT NULL;
    ALTER TABLE "public"."external_list" add column name text NOT NULL;
    ALTER TABLE "public"."external_list" add column description text NOT NULL DEFAULT '';
    ALTER TABLE "public"."external_list" add column list_count integer NOT NULL;
    ALTER TABLE "public"."external_list" add column door_count integer NOT NULL;
    CREATE UNIQUE INDEX external_list_pkey ON "public"."external_list" (system_id ASC , external_id ASC )  ;
    ALTER TABLE "public"."external_list" ADD PRIMARY KEY USING INDEX external_list_pkey;

    CREATE FUNCTION "public".fetch_saved_list(saved_list_id integer, row_merge json, column_config json, handler text, after text, context json) RETURNS void as $$ declare
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


    CREATE FUNCTION "public".insert_van_contact_batch_to_campaign_contact(record_list json) RETURNS void as $$ insert into campaign_contact (campaign_id, first_name, last_name, zip, custom_fields, cell)
    select
      (r ->> 'campaign_id')::integer,
      r ->> 'first_name',
      r ->> 'last_name',
      r ->> 'zip',
      r ->> 'custom_fields',
      r ->> 'cell'
    from json_array_elements(record_list) as r
     $$ language sql volatile SECURITY definer SET search_path = "public";
    CREATE FUNCTION "public".mark_loading_job_done(payload json, result json, context json) RETURNS void as $$
     $$ language sql volatile SECURITY definer SET search_path = "public";
    CREATE FUNCTION "public".queue_load_list_into_campaign(campaign_id integer, list_external_id integer) RETURNS void as $$ select fetch_saved_list(
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
    CREATE FUNCTION "public".insert_saved_lists(payload json, result json, context json) RETURNS void as $$ insert into external_list
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


    CREATE FUNCTION "public".queue_refresh_saved_lists(van_system_id uuid) RETURNS void as $$ declare
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

    CREATE FUNCTION "public".get_api_key_ref_from_van_system_with_id(van_system_id uuid) RETURNS text as $$ select api_key_ref
    from external_system
    where id = get_api_key_ref_from_van_system_with_id.van_system_id
     $$ language sql stable SECURITY definer SET search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    DROP TABLE "public"."external_system";
    DROP TABLE "public"."external_list";

    DROP FUNCTION "public".fetch_saved_list;
    DROP FUNCTION "public".insert_van_contact_batch_to_campaign_contact;
    DROP FUNCTION "public".queue_load_list_into_campaign;
    DROP FUNCTION "public".mark_loading_job_done;
    DROP FUNCTION "public".insert_saved_lists;
    DROP FUNCTION "public".queue_refresh_saved_lists;
    DROP FUNCTION "public".get_api_key_ref_from_van_system_with_id;
    DROP EXTENSION "uuid-ossp";
  `);
};
