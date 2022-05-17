import { fromPairs } from "lodash";
import { Task } from "pg-compose";

import { config } from "../../config";

interface Payload {
  fireDate: string;
}

const queueAutoSendInitials: Task = async (payload: Payload, helpers) => {
  const contactsToQueueInOneMinute = config.AUTOSEND_MESSAGES_PER_SECOND * 60;

  const restrictTimezone = config.isTest ? "true or" : "";

  const { rows: contactsQueued } = await helpers.query<{
    campaign_id: string;
    count_queued: string;
  }>(
    `
      with contacts_to_queue as (
        select cc.id, cc.cell, cc.campaign_id, row_number() over (partition by 1) as n
        from campaign_contact cc
        join campaign c on cc.campaign_id = c.id 
        where true
          -- contact requirements
          and cc.archived = false
          and cc.message_status = 'needsMessage'
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
        order by assignment_id nulls last, cc.campaign_id, cc.cell asc
        limit $1
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
      jobs_queued as (
        insert into graphile_worker.jobs (task_identifier, payload, key, queue_name, max_attempts, run_at)
        select 
          'retry-interaction-step' as task_identifier, 
          json_build_object(
            'campaignContactId', id, 
            'campaignId', campaign_id,
            'unassignAfterSend', true
          ) as payload,
          id::text as key,
          null as queue_name,
          1 as max_attempts,
          now() + ((n / $2::float) * interval '1 second') as run_at
        from contacts_to_queue
        -- this line doesn't modify the result at all, it just forces the execution of the intermediate CTE
        where id in ( select id from contacts_assigned )
        on conflict (key)
        do update set 
          run_at = excluded.run_at
        returning *
      ),
      campaign_breakdown as (
        select c.id as campaign_id, a.id as assignment_id,
          ( select count(*) from jobs_queued where payload->>'campaignId' = c.id::text and attempts = 0) as count_queued,
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
    [contactsToQueueInOneMinute, config.AUTOSEND_MESSAGES_PER_SECOND]
  );

  const { rows: countToSendLater } = await helpers.query<{
    campaign_id: string;
    count_to_send_later: string;
  }>(
    `
      select cc.campaign_id, count(*) as count_to_send_later
      from campaign_contact cc
      join campaign c on cc.campaign_id = c.id
      where true
        -- campaign requirements for autosending
        and c.is_archived = false
        and c.is_started = true
        and c.autosend_status = 'sending'
        -- NOT is here - these are only people outside of sending hours
        and not (
            ( cc.timezone is null
              and extract(hour from CURRENT_TIMESTAMP at time zone c.timezone) < c.texting_hours_end
              and extract(hour from CURRENT_TIMESTAMP at time zone c.timezone) >= c.texting_hours_start
            )
          or 
            ( c.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone) + interval '10 minutes')
              and c.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone ))
            )
        )
      group by 1
    `
  );

  const toSendLaterMap = fromPairs(
    countToSendLater.map(({ campaign_id, count_to_send_later }) => [
      campaign_id,
      count_to_send_later
    ])
  );

  const toMarkAsDoneSending = contactsQueued
    .filter((campaign) => {
      const countQueued = parseInt(campaign.count_queued, 10);
      const countToSendLaterForCampaign =
        toSendLaterMap[campaign.campaign_id] || 0;
      return countQueued === 0 && countToSendLaterForCampaign === 0;
    })
    .map((campaign) => campaign.campaign_id);

  await helpers.query(
    `update campaign set autosend_status = 'complete' where id = ANY($1)`,
    [toMarkAsDoneSending]
  );
};

export default queueAutoSendInitials;
