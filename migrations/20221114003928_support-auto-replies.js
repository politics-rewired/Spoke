/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function up(knex) {
  return knex.schema.raw(`
    create table auto_reply_trigger (
      id serial primary key,
      token text not null,
      parent_interaction_step_id int not null references interaction_step (id),
      child_interaction_step_id int not null references interaction_step (id),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint unique_token_per_parent_interaction_step_id unique (parent_interaction_step_id, token)
    );

    alter table campaign_contact
      add column is_auto_reply_eligible boolean not null default true;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
  return knex.schema
    .dropTable("auto_reply_trigger")
    .alterTable("campaign_contact", (table) => {
      table.dropColumn("is_auto_reply_eligible");
    });
};
