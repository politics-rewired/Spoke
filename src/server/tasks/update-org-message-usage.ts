import { JobHelpers, Task } from "pg-compose";

import { config } from "../../config";

const updateOrgMessageUsage: Task = async (
  payload: any,
  helpers: JobHelpers
) => {
  if (config.ENABLE_MONTHLY_ORG_MESSAGE_LIMITS) {
    await helpers.query(
      `
        insert into monthly_organization_message_usages (organization_id, month, sent_message_count)
        select 
          campaign.organization_id, 
          date_trunc('month', now()) as month,
          count(*) as sent_message_count
        from message
        join campaign_contact on campaign_contact.id = message.campaign_contact_id
        join campaign on campaign.id = campaign_contact.campaign_id
        where message.created_at >= date_trunc('minute', $1) - interval '5 minutes'
          and message.created_at < date_trunc('minute', $1)
          and message.is_from_contact = false
        group by 1, 2
        on conflict (organization_id, month)
        do update
        set 
          sent_message_count = 
            excluded.sent_message_count +
            monthly_organization_message_usages.sent_message_count
      `,
      [payload.fireDate]
    );
  }
};

export default updateOrgMessageUsage;
