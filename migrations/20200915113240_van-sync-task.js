exports.up = function(knex) {
  return knex.raw(`
    -- Update job_request status or mark as done
    create function public.update_van_sync_job_request_status()
      returns void as $$
    declare
      v_job_request_id integer;
      v_contact_count integer;
      v_remaining_syncs integer;
      v_result_message text;
    begin
      with pending_sync_jobs as (
        select
          id,
          ((payload::json)->>'contact_count')::integer as contact_count
        from job_request
        where
          created_at > now() - '12 hour'::interval
          and job_type = 'sync_van_campaign'
          and status <> 100
        order by campaign_id, updated_at desc
      ),
      payloads as (
        select
          id,
          contact_count,
          sum(jobs_remaining) as jobs_remaining,
          jsonb_object_agg(last_error, error_count) filter (where last_error is not null) as errors
        from (
          select
            pending_sync_jobs.id,
            pending_sync_jobs.contact_count,
            count(jobs.id) as jobs_remaining,
            count(jobs.last_error) as error_count,
            jobs.last_error
          from pending_sync_jobs
          left join graphile_worker.jobs jobs
            on (jobs.payload->'__context'->>'job_request_id')::integer = pending_sync_jobs.id
          group by 1, 2, 5
        ) inner_grouping
        group by 1, 2
      )
      update job_request
      set
        status = (contact_count - jobs_remaining) / (contact_count) * 100,
        result_message = (
          json_build_object('message', 'Synced ' || (contact_count - jobs_remaining) || ' of ' || contact_count || ' contacts to VAN')::jsonb
          || (
            case
              when errors is not null then json_build_object('error_counts', errors)::jsonb
              else '{}'::jsonb
            end
          )
        )::text
      from payloads
      where job_request.id = payloads.id;
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

exports.down = function(knex) {
  return knex.raw(`
    drop function public.queue_sync_campaign_to_van(integer);
    drop function public.update_van_sync_job_request_status();
  `);
};
