exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace function "public".insert_van_contact_batch_to_campaign_contact(record_list json) returns void as $$
      insert into campaign_contact (campaign_id, external_id, first_name, last_name, zip, custom_fields, cell)
      select
        (r ->> 'campaign_id')::integer,
        r ->> 'external_id',
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
          'external_id', 'VanID',
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
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
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
  `);
};
