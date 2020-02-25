// -- TODO
// campaign_contact_tag
// interaction_step
// redefinining question_response view

/*

Actual migration in practice:

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
      table
        .integer("campaign_id")
        .notNullable()
        .references("campaign(id)");
    }),
    knex.schema.alterTable("opt_out", table => {
      table
        .integer("campaign_id")
        .notNullable()
        .references("campaign(id)");
    }),
    knex.schema.alterTable("all_question_response", table => {
      table
        .integer("campaign_id")
        .notNullable()
        .references("campaign(id)");
    }),
    knex.schema.raw(`
      drop view question_response;
      create view question_response as
        select *
        from all_question_response
        where all_question_response.is_deleted = false;
    `),
    knex.schema.createTable("sent_message_service_id", table => {
      table.integer("service_id").primary();
      table.integer("campaign_id").references("campaign(id)");
      table.integer("message_id").references("message(id)");
      table.timestamp("created_at").default(knex.fn.now());
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
    `)
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.alterTable("message", table => {
      table.dropColumn("campaign_id");
    }),
    knex.schema.alterTable("all_question_response", table => {
      table.dropColumn("campaign_id");
    }),
    knex.schema.alterTable("opt_out", table => {
      table.dropColumn("campaign_id");
    }),
    knex.schema.dropTable("sent_message_service_id")
    // knex.schema.raw(
    //   `drop function get_messaging_service_for_cell_in_organization`
    // )
  ]);
};
