exports.up = function up(knex) {
  return knex.schema.raw(
    `
      alter table message
        add column campaign_variable_ids integer[] not null default '{}'::integer[];
    `
  );
};

exports.down = function down(knex) {
  return knex.schema.raw(
    `
      alter table message
        drop column campaign_variable_ids;
    `
  );
};
