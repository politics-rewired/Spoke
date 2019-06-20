-- Select query to look at forward progress differences
with
  latest_log as (
    select
      message_sid,
      service_response_at,
      (case
        when message_status = 'queued' then 'SENDING'
        when message_status = 'failed' then 'ERROR'
        when message_status = 'sent' then 'SENT'
        when message_status = 'delivered' then 'DELIVERED'
        when message_status = 'undelivered' then 'ERROR'
        end) as spoke_status
    from (
      select distinct on (message_sid)
        message_sid,
        created_at as service_response_at,
        body::json->>'MessageStatus' as message_status
      from
        log
      where
        created_at > now() - interval '20 minute'
      order by
        message_sid,
        created_at desc
    ) as log_status
  )
select
  message.service_id,
  message.send_status,
  latest_log.spoke_status,
  latest_log.service_response_at
from
  message,
  latest_log
where
  message.service_id = latest_log.message_sid
  and message.send_status <> latest_log.spoke_status
  and message.send_status <> 'DELIVERED'
  and message.send_status <> 'ERROR'
;

-- Update query to replay the log entries (idempotent)
with
  latest_log as (
    select
      message_sid,
      service_response_at,
      (case
        when message_status = 'queued' then 'SENDING'
        when message_status = 'failed' then 'ERROR'
        when message_status = 'sent' then 'SENT'
        when message_status = 'delivered' then 'DELIVERED'
        when message_status = 'undelivered' then 'ERROR'
      end) as spoke_status
    from (
      select distinct on (message_sid)
        message_sid,
        created_at as service_response_at,
        body::json->>'MessageStatus' as message_status
      from
        log
      order by
        message_sid,
        created_at desc
    ) as log_status
  ),
  update_payload as (
    select
      message.service_id,
      latest_log.spoke_status,
      latest_log.service_response_at
    from
      message,
      latest_log
    where
      message.service_id = latest_log.message_sid
      and message.send_status <> latest_log.spoke_status
      and message.send_status <> 'DELIVERED'
      and message.send_status <> 'ERROR'
    limit 100
  )
update
  message
set
  send_status = update_payload.spoke_status,
  service_response_at = update_payload.service_response_at
from
  update_payload
where
  message.service_id = update_payload.service_id
;
