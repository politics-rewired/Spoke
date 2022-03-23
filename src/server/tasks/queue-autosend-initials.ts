import { fromPairs } from "lodash";
import { Task } from "pg-compose";

import { config } from "../../config";

const queueAutoSendInitials: Task = async (payload, helpers) => {
  const contactsToQueueInOneMinute = config.AUTOSEND_MESSAGES_PER_SECOND * 60;

  const { rows: contactsQueued } = await helpers.query<{
    campaign_id: number;
    count_queued: number;
  }>(
    `
      with contacts_to_queue as (
        select cc.id, campaign_id row_number() over (partition by 1) as n
        from campaign_contact cc
        join campaign c on cc.campaign_id = c.id 
        where true
          -- contact requirements
          and cc.is_archived = false
          and cc.message_status = 'needsMessage'
          and cc.assignment_id is null
          -- campaign requirements for autosending
          and c.is_archived = false
          and c.is_started = true
          and c.autosend_status = 'sending'
          -- is textable now
          and (
              ( cc.timezone zone is null
                and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
                and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
              )
            or 
              ( campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone) + interval '10 minutes')
                and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone ))
              )
          )
          -- skip people currently queued
          and not exists (
            select 1 
            from graphile_worker.jobs 
            where task_identifier = 'retry-interaction-step'
              and graphile_worker.jobs.key = cc.id::text
          )
        order by cc.campaign_id asc
        limit $1
      ),
      jobs_queued as (
        insert into graphile_worker.jobs (task_identifier, payload, job_key, queue_name, max_attempts, run_at)
        select 
          'retry-interaction-step' as task_identifier, 
          json_build_object('campaignContactId', id, 'campaignId', campaign_id) as payload,
          id::text as job_key,
          null as queue_name,
          1 as max_attempts,
          now() + ((n / $2::float) * interval '1 second') as run_at
        from contacts_to_queue
        returning 1
      ),
      campaign_breakdown as (
        select c.id as campaign_id,
          ( select count(*) from jobs_queued where payload->>'campaignId' = c.id ) as count_queued
        from campaign c 
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
    campaign_id: number;
    count_to_send_later: number;
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
            ( cc.timezone zone is null
              and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) < campaign.texting_hours_end
              and extract(hour from CURRENT_TIMESTAMP at time zone campaign.timezone) >= campaign.texting_hours_start
            )
          or 
            ( campaign.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone) + interval '10 minutes')
              and campaign.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone ))
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
      const countQueued = campaign.count_queued;
      const countToSendLaterForCampaign = toSendLaterMap[campaign.campaign_id];
      return countQueued === 0 && countToSendLaterForCampaign === 0;
    })
    .map((campaign) => campaign.campaign_id);

  await helpers.query(
    `update campaign set autosend_status = 'complete' where id = ANY($1)`,
    [toMarkAsDoneSending]
  );
};

export default queueAutoSendInitials;
