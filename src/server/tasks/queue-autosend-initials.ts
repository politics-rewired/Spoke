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
      where autosending_mps is not null
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

  const { rows: contactsQueued } = await helpers.query<{
    campaign_id: string;
    count_queued: string;
  }>(
    `
      with selected_contacts as (
        select cc.id, cc.cell, cc.campaign_id
        from campaign_contact cc
        join campaign c on cc.campaign_id = c.id 
        where true
          -- organization requirements
          and c.organization_id = $3
          -- contact requirements
          and cc.archived = false
          and cc.message_status = 'needsMessage'
          and cc.is_opted_out = false
          and (
            c.autosend_limit_max_contact_id is null
            or cc.id <= c.autosend_limit_max_contact_id
          )
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
        -- ordering by campaign id and cell should be fastest since theres a compound key on them
        order by cc.campaign_id asc, assignment_id nulls first, cc.cell asc
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
        order by c.id asc
      )
      select * from campaign_breakdown
    `,
    [contactsToQueueInOneMinute, autosendingMps, organizationId]
  );

  const campaignIdsQueued = contactsQueued.map((cq) => cq.campaign_id);

  await helpers.query(
    `
      with sendable_contacts as (
        select id, campaign_id
        from campaign_contact
        where true
          and archived = false
          and message_status = 'needsMessage'
          and is_opted_out = false
      ),
      campaign_summary_raw as (
        select
          c.id as campaign_id,
          c.autosend_limit_max_contact_id,
          count(cc.id) as total_count_to_send,
          min(cc.id) as min_cc_id
        from campaign c
        left join sendable_contacts cc on cc.campaign_id = c.id
        where true
          -- organization requirements for autosending
          and c.organization_id = $1
          -- campaign requirements for autosending
          and c.id = ANY ($2::integer[])
          and c.is_archived = false
          and c.is_started = true
          and c.autosend_status = 'sending'
        group by 1, 2
      ),
      campaign_summary as (
        select
          campaign_id,
          (case
            when total_count_to_send = 0 then 'complete'
            when (
              autosend_limit_max_contact_id is not null
              and min_cc_id > autosend_limit_max_contact_id
            ) then 'paused'
            else null
          end) as new_autosend_status
        from campaign_summary_raw
      )
      update campaign
      set autosend_status = new_autosend_status
      from campaign_summary
      where
        campaign_summary.campaign_id = campaign.id
        and new_autosend_status is not null
    `,
    [organizationId, campaignIdsQueued]
  );
};
