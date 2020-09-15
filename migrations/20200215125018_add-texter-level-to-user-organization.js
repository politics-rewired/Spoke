exports.up = function(knex) {
  return knex.schema
    .raw(
      `create type texter_status as enum ('do_not_approve', 'approval_required', 'auto_approve');`
    )
    .then(() =>
      knex.schema.alterTable("user_organization", table => {
        table
          .specificType("request_status", "texter_status")
          .notNullable()
          .defaultTo("approval_required");
      })
    );
};

exports.down = function(knex) {
  return knex.schema
    .alterTable("user_organization", table => {
      table.dropColumn("request_status");
    })
    .then(() => knex.schema.raw(`drop type texter_status`));
};
