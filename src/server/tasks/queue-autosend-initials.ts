import type { Task } from "graphile-worker";

import { config } from "../../config";

interface Payload {
  organization_id: number;
}

export const QUEUE_AUTOSEND_INITIALS_TASK_IDENTIFIER =
  "queue-autosend-initials";
export const QUEUE_AUTOSEND_ORGANIZATION_INITIALS_TASK_IDENTIFIER =
  "queue-autosend-organization-initials";

export const queueAutoSendInitials: Task = async (payload, helpers) => {
  await helpers.query(
    `
      select graphile_worker.add_job(
        $1::text,
        json_build_object('organization_id', organization.id),
        job_key := format('%s|%s', $1::text, organization.id)
      )
      from organization
      where true
        and autosending_mps is not null
        and autosending_mps > 0
    `,
    [QUEUE_AUTOSEND_ORGANIZATION_INITIALS_TASK_IDENTIFIER]
  );
};

export const queueAutoSendOrganizationInitials: Task = async (
  payload: Payload,
  helpers
) => {
  const organizationId = payload.organization_id;

  const {
    rows: [org]
  } = await helpers.query<{ autosending_mps: number }>(
    "select autosending_mps from organization where id = $1",
    [organizationId]
  );

  const autosendingMps = org?.autosending_mps;

  if (!autosendingMps) {
    throw new Error(
      `queueAutoSendInitials was queued for organization ${organizationId} but autosending_mps is ${autosendingMps}`
    );
  }

  const contactsToQueueInOneMinute = autosendingMps * 60;

  const restrictTimezone = config.isTest ? "true or" : "";

  await helpers.query(
    `
      with candidate_contacts as (
        select cc.id, cc.assignment_id, cc.cell, cc.campaign_id, cc.message_status, c.autosend_limit
        from campaign_contact cc
        join campaign c on cc.campaign_id = c.id 
        where true
          -- organization requirements
          and c.organization_id = $3
          -- contact requirements
          and cc.archived = false
          and cc.is_opted_out = false
          -- campaign requirements for autosending
          and c.is_archived = false
          and c.is_started = true
          and c.autosend_status = 'sending'
          -- is textable now
          and (
            ${restrictTimezone}
              ( cc.timezone is null
                and extract(hour from CURRENT_TIMESTAMP at time zone c.timezone) < c.texting_hours_end
                and extract(hour from CURRENT_TIMESTAMP at time zone c.timezone) >= c.texting_hours_start
              )
            or 
              ( c.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone) + interval '10 minutes')
                and c.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone ))
              )
          )
          -- dont skip people currently queued, use job key instead
          -- and not exists (
          --  select 1 
          --  from graphile_worker.jobs 
          --  where task_identifier = 'retry-interaction-step'
          --    and graphile_worker.jobs.key = cc.id::text
          -- )
      ),
      selected_contacts as (
        select id, cell, campaign_id
        from (
          select
            *,
            row_number() over (
              partition by campaign_id
              order by campaign_id asc, assignment_id nulls first, cell asc
            ) as row_num
          from candidate_contacts
        ) x
        where true
          and x.message_status = 'needsMessage'
          and (
            x.autosend_limit is null
            or x.row_num <= x.autosend_limit
          )
        order by campaign_id asc, assignment_id nulls first, cell asc
        limit $1
      ),
      contacts_to_queue as (
        select *, row_number() over (partition by 1) as n
        from selected_contacts
      ),
      assignments_upserted as (
        insert into assignment (campaign_id, user_id)
        select id, autosend_user_id
        from campaign
        where campaign.id in ( select campaign_id from contacts_to_queue )
        on conflict (user_id, campaign_id) 
        -- https://stackoverflow.com/questions/34708509/how-to-use-returning-with-on-conflict-in-postgresql/37543015#37543015
        do update set campaign_id = excluded.campaign_id
        returning *
      ),
      contacts_assigned as (
        update campaign_contact 
        set assignment_id = (
          select id
          from assignments_upserted
          where assignments_upserted.campaign_id = campaign_contact.campaign_id
        )
        where id in ( select id from contacts_to_queue )
        returning id
      ),
      new_jobs_queued as (
        insert into graphile_worker.jobs (task_identifier, payload, key, queue_name, max_attempts, run_at, priority)
        select 
          'retry-interaction-step' as task_identifier, 
          json_build_object(
            'campaignContactId', id, 
            'campaignId', campaign_id,
            'unassignAfterSend', true
          ) as payload,
          format('%s|%s', 'retry-interaction-step', id) as key,
          null as queue_name,
          1 as max_attempts,
          now() + ((n / $2::float) * interval '1 second') as run_at,
          -- prioritize in order as: autoassignment, autosending, handle delivery reports
          4 as priority
        from contacts_to_queue
        -- this line doesn't modify the result at all, it just forces the execution of the intermediate CTE
        where id in ( select id from contacts_assigned )
        on conflict (key) do nothing
        returning id, payload->>'campaignId' as campaign_id, attempts
      ),
      all_jobs_queued as (
        select * from new_jobs_queued
        union
        select id, payload->>'campaignId' as campaign_id, attempts
        from graphile_worker.jobs
        where
          task_identifier = 'retry-interaction-step'
          and key in ( select id::text from contacts_assigned )
      ),
      campaign_breakdown as (
        select c.id as campaign_id, a.id as assignment_id,
          ( select count(*) from all_jobs_queued where campaign_id = c.id::text and attempts = 0) as count_queued,
          ( select count(*) from assignments_upserted ) as assignments_upserted_count,
          ( select array_agg(campaign_id) from contacts_to_queue ) as campaigns_contacts_queued_on
        from campaign c 
        left join assignments_upserted a on a.campaign_id = c.id
        where true
          and c.is_archived = false
          and c.is_started = true
          and c.autosend_status = 'sending'
          and c.organization_id = $3
        order by c.id asc
      )
      select * from campaign_breakdown
    `,
    [contactsToQueueInOneMinute, autosendingMps, organizationId]
  );

  await helpers.query(
    `
      with candidate_campaigns as (
        select
          c.id as campaign_id,
          count(cc.id) filter (where message_status <> 'needsMessage') as sent_count,
          count(cc.id) filter (where message_status = 'needsMessage') as to_send_count
        from campaign c
        left join campaign_contact cc on cc.campaign_id = c.id
        where true
          -- organization requirements for autosending
          and c.organization_id = $1
          -- campaign requirements for autosending
          and c.is_archived = false
          and c.is_started = true
          and c.autosend_status = 'sending'
        group by 1
      )
      update campaign
      set
        autosend_status = (case
          when to_send_count = 0 then 'complete'
          when autosend_limit is not null and sent_count >= autosend_limit  then 'paused'
          else autosend_status
        end)
      from candidate_campaigns
      where candidate_campaigns.campaign_id = campaign.id
    `,
    [organizationId]
  );
};
