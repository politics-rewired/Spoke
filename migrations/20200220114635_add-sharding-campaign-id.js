// -- TODO
// campaign_contact_tag
// interaction_step
// redefinining question_response view

/*

Actual migration in practice:

ALTER TABLE public.message ADD COLUMN campaign_id integer references campaign (id);

ALTER TABLE public.opt_out ADD COLUMN campaign_id integer references campaign (id);

ALTER TABLE public.all_question_response ADD COLUMN campaign_id integer references campaign (id);

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
  WHERE campaign_contact.id = all_question_response.campaign_contact
    and all_question_response.campaign_id is null
    and all_question_response.id >= min_id
    and all_question_response.id < max_id
$$ language sql strict;

-- Run the above functions over all rows

alter table message alter column campaign_id set not null;
alter table opt_out alter column campaign_id set not null;
alter table all_question_response alter column campaign_id set not null;
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
    })
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
    })
  ]);
};
