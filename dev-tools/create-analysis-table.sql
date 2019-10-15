create table flat_analysis_table (
  from_number text,
  to_number text,
  messaging_service_sid text,
  sms_status text,
  error_code text,
  message_sid text,
  created_at timestamp,
  domain text,
  is_a_reply boolean
);

create index flat_analysis_created_at_idx on flat_analysis_table (created_at) asc;

create view flat_analysis_seed_view as
  select *
  from (
    select
      destructured_log.*,
      message.text,
      message.created_at,
      message.contact_number as to_number,
      link_domain.domain,
      exists (
        select 1
        from message as message_in_reply_to
        where message.campaign_contact_id = message_in_reply_to.campaign_contact_id
          and message_in_reply_to.is_from_contact = true
      ) as is_a_reply
    from
      (
        select
          log.body::jsonb ->> 'From' as from_number,
          log.body::jsonb ->> 'MessagingServiceSid' as messaging_service_sid,
          log.body::jsonb ->> 'SmsStatus' as sms_status,
          log.body::jsonb ->> 'ErrorCode' as error_code,
          message_sid
        from log
        where log.body::jsonb ->> 'SmsStatus' in ('delivered', 'undelivered', 'failed')
      ) as destructured_log
    join message
      on message.service_id = destructured_log.message_sid
    left join link_domain
      on message.text like '%' || link_domain.domain || '%'
  ) as flat_analysis_table;

create view flat_analysis_seed_view_to_update as
  with last_added_log as (
    select created_at
    from flat_analysis_table
    order by created_at asc
    limit 1
  )
  select *
  from flat_analysis_seed_view
  where flat_analysis_seed_view.created_at > (
    select created_at
    from last_added_log
    limit 1;
  );

-- To add N more entries
insert into flat_analysis_table
select from flat_analysis_seed_view_to_update
limit N
returning 1;
