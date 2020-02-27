/*

If this migration needs to be run on a very large database without downtime,
the following backfill functions can be run in chunks of 1-2 million safetly.

ALTER TABLE public.message ADD COLUMN campaign_id integer references campaign (id);

ALTER TABLE public.opt_out ADD COLUMN campaign_id integer references campaign (id);

ALTER TABLE public.all_question_response ADD COLUMN campaign_id integer references campaign (id);

ALTER TABLE public.campaign_contact_tag ADD COLUMN campaign_id integer references campaign (id);

create or replace function backfill_message_campaign_id_batch(min_id integer, max_id integer) returns void as $$
  UPDATE message
  SET campaign_id = campaign_contact.campaign_id
  FROM campaign_contact
  WHERE campaign_contact.id = message.campaign_contact_id
    and message.campaign_id is null
    and message.id >= min_id
    and message.id < max_id
$$ language sql strict;

create or replace function backfill_opt_out_campaign_id_batch(min_id integer, max_id integer) returns void as $$
  UPDATE opt_out
  SET campaign_id = assignment.campaign_id
  FROM assignment
  WHERE assignment.id = opt_out.assignment_id
    and opt_out.campaign_id is null
    and opt_out.id >= min_id
    and opt_out.id < max_id
$$ language sql strict;

create or replace function backfill_all_question_response_campaign_id_batch(min_id integer, max_id integer) returns void as $$
  UPDATE all_question_response
  SET campaign_id = campaign_contact.campaign_id
  FROM campaign_contact
  WHERE campaign_contact.id = all_question_response.campaign_contact_id
    and all_question_response.campaign_id is null
    and all_question_response.id >= min_id
    and all_question_response.id < max_id
$$ language sql strict;

create or replace function backfill_campaign_contact_tag_campaign_id_batch(min_id integer, max_id integer) returns void as $$
  UPDATE campaign_contact_tag
  SET campaign_id = campaign_contact.campaign_id
  FROM campaign_contact
  WHERE campaign_contact.id = campaign_contact_tag.campaign_contact_id
    and campaign_contact_tag.campaign_id is null
    and campaign_contact_tag.campaign_contact_id >= min_id
    and campaign_contact_tag.campaign_contact_id < max_id
$$ language sql strict;

-- If you need a procedure
do $$
declare
  min_id integer;
  highest_id_to_backfill integer;
begin
  min_id := 0;

  select max(id)
  from message
  into highest_id_to_backfill;

  loop
    exit when min_id >= highest_id_to_backfill;
    perform backfill_message_campaign_id_batch(min_id, min_id + 100000);
    commit;
    min_id := min_id + 100000;
    raise notice 'Did %', min_id;
  end loop;
end;
$$ language plpgsql;

-- Run the above functions over all rows

alter table message alter column campaign_id set not null;
alter table opt_out alter column campaign_id set not null;
alter table all_question_response alter column campaign_id set not null;
alter table campaign_contact_tag alter column campaign_id set not null;
*/

exports.up = function(knex) {
  return Promise.all([
    knex.schema.alterTable("message", table => {
      table.integer("campaign_id").references("campaign(id)");
    }),
    knex.schema.alterTable("opt_out", table => {
      table.integer("campaign_id").references("campaign(id)");
    }),
    knex.schema.alterTable("all_question_response", table => {
      table.integer("campaign_id").references("campaign(id)");
    }),
    knex.schema.raw(`
      UPDATE message
      SET campaign_id = campaign_contact.campaign_id
      FROM campaign_contact
      WHERE campaign_contact.id = message.campaign_contact_id
        and message.campaign_id is null;
  
      UPDATE opt_out
      SET campaign_id = assignment.campaign_id
      FROM assignment
      WHERE assignment.id = opt_out.assignment_id
        and opt_out.campaign_id is null;
  
      UPDATE all_question_response
      SET campaign_id = campaign_contact.campaign_id
      FROM campaign_contact
      WHERE campaign_contact.id = all_question_response.campaign_contact_id
        and all_question_response.campaign_id is null;
  
      UPDATE campaign_contact_tag
      SET campaign_id = campaign_contact.campaign_id
      FROM campaign_contact
      WHERE campaign_contact.id = campaign_contact_tag.campaign_contact_id
        and campaign_contact_tag.campaign_id is null;

      alter table message alter column campaign_id set not null;
      alter table opt_out alter column campaign_id set not null;
      alter table all_question_response alter column campaign_id set not null;
      alter table campaign_contact_tag alter column campaign_id set not null;
    `),
    knex.schema.raw(`
      drop view question_response;
      create view question_response as
        select *
        from all_question_response
        where all_question_response.is_deleted = false;
    `),
    // We can always safely delete entries from here that are duplicates or from archived campaigns
    knex.schema.createTable("sent_message", table => {
      table.integer("service_id").primary();
      table.integer("campaign_id").references("campaign(id)");
      table.integer("message_id").references("message(id)");
      table.integer("contact_number").notNullable();
      table.text("messaging_service_sid").notNullable();
      table.timestamp("created_at").default(knex.fn.now());

      table.index("sent_message_messaging_service_contact_number_idx", [
        "messaging_service_sid",
        "contact_number"
      ]);
    }),
    knex.schema.raw(`
      create function get_messaging_service_for_cell_in_organization(cell text, organization_id integer)
      returns messaging_service
      as $$
        select *
        from messaging_service
        where exists (
          select 1
          from messaging_service_stick
          where messaging_service_stick.cell = get_messaging_service_for_cell_in_organization.cell
            and organization_id = get_messaging_service_for_cell_in_organization.organization_id
            and messaging_service_stick.messaging_service_sid = messaging_service.messaging_service_sid
        )
      $$ language sql strict stable;
    `),
    knex.schema.raw(`
      drop function get_messaging_service_for_campaign_contact_in_organization;
    `),
    knex.schema.raw(`
      create or replace view assignable_campaign_contacts as (
        select
          campaign_contact.id, campaign_contact.campaign_id,
          campaign_contact.message_status, campaign.texting_hours_end,
          campaign_contact.timezone::text as contact_timezone
        from campaign_contact
        join campaign on campaign_contact.campaign_id = campaign.id
        where assignment_id is null
          and is_opted_out = false
          and archived = false
          and not exists (
            select 1
            from campaign_contact_tag
            join tag on campaign_contact_tag.tag_id = tag.id
            where tag.is_assignable = false
              and campaign_contact_tag.campaign_contact_id = campaign_contact.id
              and campaign_contact_tag.campaign_id = campaign_contact.campaign_id
          )
      );

      create or replace view assignable_campaign_contacts_with_escalation_tags as (
        select
          campaign_contact.id,
          campaign_contact.campaign_id,
          campaign_contact.message_status,
          campaign_contact.timezone::text as contact_timezone,
          array_agg(tag.id) as applied_escalation_tags
        from campaign_contact
        join campaign_contact_tag on campaign_contact_tag.campaign_contact_id = campaign_contact.id
          and campaign_contact_tag.campaign_id = campaign_contact.campaign_id
        join tag on campaign_contact_tag.tag_id = tag.id
        where assignment_id is null
          and is_opted_out = false
          and tag.is_assignable = false
        group by 1, 2, 3, 4
      );
    `)
  ]);
};

exports.down = function(knex) {
  return (
    Promise.all([
      knex.schema.alterTable("message", table => {
        table.dropColumn("campaign_id");
      }),
      knex.schema.alterTable("all_question_response", table => {
        table.dropColumn("campaign_id");
      }),
      knex.schema.alterTable("opt_out", table => {
        table.dropColumn("campaign_id");
      }),
      knex.schema.dropTable("sent_message"),
      knex.schema.raw(`
      drop view question_response;
      create view question_response as
        select *
        from all_question_response
        where all_question_response.is_deleted = false;
    `),
      knex.schema.raw(
        `drop function get_messaging_service_for_cell_in_organization`
      ),
      knex.schema.raw(`
      create function get_messaging_service_for_campaign_contact_in_organization(campaign_contact_id integer, organization_id integer)
      returns messaging_service
      as $$
        select *
        from messaging_service
        where exists (
          select 1
          from messaging_service_stick
          where exists (
              select 1
              from campaign_contact
              where messaging_service_stick.cell = campaign_contact.cell
                and campaign_contact.id = get_messaging_service_for_campaign_contact_in_organization.campaign_contact_id
            )
            and organization_id = get_messaging_service_for_campaign_contact_in_organization.organization_id
            and messaging_service_stick.messaging_service_sid = messaging_service.messaging_service_sid
        )
      $$ language sql strict stable;
    `)
    ]),
    knex.schema.raw(`
    create or replace view assignable_campaign_contacts as (
        select
          campaign_contact.id, campaign_contact.campaign_id,
          campaign_contact.message_status, campaign.texting_hours_end,
          campaign_contact.timezone::text as contact_timezone
        from campaign_contact
        join campaign on campaign_contact.campaign_id = campaign.id
        where assignment_id is null
          and is_opted_out = false
          and archived = false
          and not exists (
            select 1
            from campaign_contact_tag
            join tag on campaign_contact_tag.tag_id = tag.id
            where tag.is_assignable = false
              and campaign_contact_tag.campaign_contact_id = campaign_contact.id
          )
    );

    create or replace view assignable_campaign_contacts_with_escalation_tags as (
      select
        campaign_contact.id,
        campaign_contact.campaign_id,
        campaign_contact.message_status,
        campaign_contact.timezone::text as contact_timezone,
        (
          select array_agg(tag.id)
          from campaign_contact_tag
          join tag on campaign_contact_tag.tag_id = tag.id
          where campaign_contact_tag.campaign_contact_id = campaign_contact.id
          and tag.is_assignable = false
        )  as applied_escalation_tags
      from campaign_contact
      where assignment_id is null
        and is_opted_out = false
        and archived = false
        and exists (
          select 1
          from campaign_contact_tag
          join tag on campaign_contact_tag.tag_id = tag.id
          where tag.is_assignable = false
            and campaign_contact_tag.campaign_contact_id = campaign_contact.id
        )
    );
  `)
  );
};
