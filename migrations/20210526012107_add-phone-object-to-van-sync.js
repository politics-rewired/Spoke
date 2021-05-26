exports.up = function up(knex) {
  return knex.raw(`
    create or replace function public.queue_sync_campaign_to_van(campaign_id integer)
      returns void as $$
    declare
      v_system_id uuid;
      v_username text;
      v_api_key_ref text;
      v_missing_configs integer;
      v_job_request_id integer;
      v_contact_count integer;
    begin
      select external_system_id
      from campaign where id = queue_sync_campaign_to_van.campaign_id
      into v_system_id;

      if v_system_id is null then
        raise 'No external system configured for campaign with id %', queue_sync_campaign_to_van.campaign_id;
      end if;

      select username, api_key_ref
      from external_system
      where id = v_system_id
      into v_username, v_api_key_ref;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', v_system_id;
      end if;

      select count(*)
      from external_sync_question_response_configuration qrc
      where
        qrc.campaign_id = queue_sync_campaign_to_van.campaign_id
        and qrc.system_id = v_system_id
        and is_missing = true
        and is_required = true
      into v_missing_configs;

      if v_missing_configs > 0 then
        raise 'Campaign % is missing % required configs', queue_sync_campaign_to_van.campaign_id, v_missing_configs;
      end if;

      select count(*)
      from campaign_contact
      where campaign_contact.campaign_id = queue_sync_campaign_to_van.campaign_id
      into v_contact_count;

      insert into public.job_request (campaign_id, payload, result_message, queue_name, job_type, status)
      values (
        campaign_id,
        json_build_object('contact_count', v_contact_count)::text,
        json_build_object('message', 'Synced 0 of ' || v_contact_count || ' contacts to VAN')::text,
        campaign_id::text || ':sync_campaign',
        'sync_van_campaign',
        0
      )
      returning id
      into v_job_request_id;

      perform
        graphile_worker.add_job(
          'van-sync-campaign-contact',
          json_build_object(
            'username', v_username,
            'api_key', json_build_object('__secret', v_api_key_ref),
            'system_id', v_system_id,
            'cc_created_at', cc.created_at,
            'campaign_id', cc.campaign_id,
            'contact_id', cc.id,
            'external_id', cc.external_id,
            'phone_id', ((cc.custom_fields)::json->>'phone_id')::integer,
            'phone_number', cc.cell,
            '__context', json_build_object(
              'job_request_id', v_job_request_id,
              'contact_count', v_contact_count
            )
          ),
          'van-api',
          priority => 10
        )
      from public.campaign_contact cc
      where
        cc.campaign_id = queue_sync_campaign_to_van.campaign_id
      ;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function down(knex) {
  return knex.raw(`
    create function public.queue_sync_campaign_to_van(campaign_id integer)
      returns void as $$
    declare
      v_system_id uuid;
      v_username text;
      v_api_key_ref text;
      v_missing_configs integer;
      v_job_request_id integer;
      v_contact_count integer;
    begin
      select external_system_id
      from campaign where id = queue_sync_campaign_to_van.campaign_id
      into v_system_id;

      if v_system_id is null then
      raise 'No external system configured for campaign with id %', queue_sync_campaign_to_van.campaign_id;
      end if;

      select username, api_key_ref
      from external_system
      where id = v_system_id
      into v_username, v_api_key_ref;

      if v_api_key_ref is null then
        raise 'No API key configured for with id %', v_system_id;
      end if;

      select count(*)
      from external_sync_question_response_configuration qrc
      where
        qrc.campaign_id = queue_sync_campaign_to_van.campaign_id
        and qrc.system_id = v_system_id
        and is_missing = true
        and is_required = true
      into v_missing_configs;

      if v_missing_configs > 0 then
        raise 'Campaign % is missing % required configs', queue_sync_campaign_to_van.campaign_id, v_missing_configs;
      end if;

      select count(*)
      from campaign_contact
      where campaign_contact.campaign_id = queue_sync_campaign_to_van.campaign_id
      into v_contact_count;

      insert into public.job_request (campaign_id, payload, result_message, queue_name, job_type, status)
      values (
        campaign_id,
        json_build_object('contact_count', v_contact_count)::text,
        json_build_object('message', 'Synced 0 of ' || v_contact_count || ' contacts to VAN')::text,
        campaign_id::text || ':sync_campaign',
        'sync_van_campaign',
        0
      )
      returning id
      into v_job_request_id;

      perform
        graphile_worker.add_job(
          'van-sync-campaign-contact',
          json_build_object(
            'username', v_username,
            'api_key', json_build_object('__secret', v_api_key_ref),
            'system_id', v_system_id,
            'cc_created_at', cc.created_at,
            'campaign_id', cc.campaign_id,
            'contact_id', cc.id,
            'external_id', cc.external_id,
            'phone_id', ((cc.custom_fields)::json->>'phone_id')::integer,
            '__context', json_build_object(
              'job_request_id', v_job_request_id,
              'contact_count', v_contact_count
            )
          ),
          'van-api',
          priority => 10
        )
      from public.campaign_contact cc
      where
        cc.campaign_id = queue_sync_campaign_to_van.campaign_id
      ;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};
