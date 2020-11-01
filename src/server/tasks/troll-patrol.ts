import { Task } from "pg-compose";
import request from "superagent";

import { config } from "../../config";
import { stringIsAValidUrl } from "../../lib/utils";
import { TrollAlarmRecord } from "../api/trollbot";
import { OrganizationRecord } from "../api/types";

export interface TrollPatrolForOrganizationPayload {
  organization_id: number;
}

export interface TrollPatrolWebhookRecord {
  organization_id: number;
  message_id: number;
  trigger_token: string;
  message_text: string;
  message_created_at: string;
  texter_id: number;
  texter_name: string;
  texter_email: string;
  campaign_id: number;
  campaign_title: string;
  campaign_contact_id: number;
  campaign_contact_name: string;
  campaign_contact_cell: string;
}

export const trollPatrol: Task = async (_payload, helpers) => {
  await helpers.query(`select * from public.troll_patrol()`);
};

export const trollPatrolForOrganization: Task = async (payload, helpers) => {
  const { organization_id } = payload as TrollPatrolForOrganizationPayload;
  const mins = config.TROLL_ALERT_PERIOD_MINUTES;

  const { rows: alarms } = await helpers.query<
    Pick<TrollAlarmRecord, "message_id">
  >(
    `select message_id from public.raise_trollbot_alarms ($1, '${mins} minute'::interval)`,
    [organization_id]
  );

  const { trollbotWebhookUrl } = await helpers
    .query<OrganizationRecord>(
      `select features from organization where id = $1`,
      [organization_id]
    )
    .then(({ rows: [{ features }] }) => JSON.parse(features))
    .catch(() => ({}));

  if (trollbotWebhookUrl && stringIsAValidUrl(trollbotWebhookUrl)) {
    const messageIds = alarms.map(({ message_id }) => message_id);
    const { rows: fullAlarms } = await helpers.query<TrollPatrolWebhookRecord>(
      `
        select
          alarm.organization_id,
          alarm.message_id,
          alarm.trigger_token,
          message.text as message_text,
          message.created_at as message_created_at,
          texter.id as texter_id,
          texter.first_name || ' ' || texter.last_name as texter_name,
          texter.email as texter_email,
          campaign_contact.id as campaign_contact_id,
          campaign_contact.first_name || ' ' || campaign_contact.last_name as campaign_contact_name,
          campaign_contact.cell as campaign_contact_cell,
          campaign.id as campaign_id,
          campaign.title as campaign_title
        from troll_alarm as alarm
        join message
          on message.id = alarm.message_id
        join public.user texter
          on texter.id = message.user_id
        join campaign_contact
          on campaign_contact.id = message.campaign_contact_id
        join campaign
          on campaign.id = campaign_contact.campaign_id
        where message_id = ANY ($1)
      `,
      [messageIds]
    );
    await Promise.all(
      fullAlarms.map((alarm) => {
        const payload = config.WEBHOOK_PAYLOAD_ALL_STRINGS
          ? Object.fromEntries(
              Object.entries(alarm).map(([key, value]) => [key, `${value}`])
            )
          : alarm;
        return request.post(trollbotWebhookUrl).send(payload);
      })
    );
  }
};
