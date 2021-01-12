exports.up = (knex) => {
  return knex.schema.raw(`
    alter table organization add column monthly_message_limit bigint;

    create table monthly_organization_message_usages (
      month integer,
      organization_id integer references organization (id),
      sent_message_count bigint,
      primary key (organization_id, month)
    );

    create or replace function backfill_current_month_organization_message_usages() returns void as $$
      insert into monthly_organization_message_usages (organization_id, month, sent_message_count)
      select 
        campaign.organization_id, 
        extract('month' from now()) as month,
        count(*) as sent_message_count
      from message
      join campaign_contact on campaign_contact.id = message.campaign_contact_id
      join campaign on campaign.id = campaign_contact.campaign_id
      where message.created_at > date_trunc('month', now())
        and message.is_from_contact = false
      group by 1, 2
      on conflict (organization_id, month)
      do update
      set 
        sent_message_count = monthly_organization_message_usages.sent_message_count
    $$ language sql;
  `);
};

exports.down = (knex) => {
  return knex.schema.raw(`
    alter table organization drop column monthly_message_limit;
    drop table organizaton_usages;
  `);
};
