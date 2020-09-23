exports.up = function(knex) {
  return knex.raw(`
    -- Update job_request status or mark as done
    create function public.mark_van_sync_job_done(payload json, result json, context json)
      returns void as $$
    declare
      v_job_request_id integer;
      v_contact_count integer;
      v_remaining_syncs integer;
      v_result_message text;
    begin
      select
        (context->>'job_request_id')::integer,
        (context->>'contact_count')::integer
      into v_job_request_id, v_contact_count;

      with locked_rows as (
        select 1
        from graphile_worker.jobs jobs
        where (jobs.payload->'__context'->>'job_request_id')::integer = v_job_request_id
        for update
      )
      -- Exclude the current job that is finishing from the remaining count
      select count(*) - 1
      from locked_rows
      into v_remaining_syncs;

      -- "Mark as done" (delete) job_request record if we are the last component job
      if v_remaining_syncs = 0 then
        -- delete from public.job_request
        -- where id = v_job_request_id;
        -- return;

        select 'Synced ' || v_contact_count || ' contacts to VAN'
        into v_result_message;
      end if;

      -- Otherwise update the job progress
      update public.job_request
      set
        status = (v_contact_count - v_remaining_syncs) / v_contact_count::numeric * 100,
        result_message = v_result_message
      where id = v_job_request_id;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";

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

      insert into public.job_request (campaign_id, payload, queue_name, job_type, status)
      values (campaign_id, '', campaign_id::text || ':sync_campaign', 'sync_van_campaign', 0)
      returning id
      into v_job_request_id;

      select count(*)
      from campaign_contact
      where campaign_contact.campaign_id = queue_sync_campaign_to_van.campaign_id
      into v_contact_count;

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
            '__after', 'public.mark_van_sync_job_done',
            '__context', json_build_object(
              'job_request_id', v_job_request_id,
              'contact_count', v_contact_count
            )
          )
        )
      from public.campaign_contact cc
      where
        cc.campaign_id = queue_sync_campaign_to_van.campaign_id
      ;
    end;
    $$ language plpgsql volatile security definer set search_path = "public";
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    drop function public.queue_sync_campaign_to_van(integer);
    drop function public.mark_van_sync_job_done(json, json, json);
  `);
};
