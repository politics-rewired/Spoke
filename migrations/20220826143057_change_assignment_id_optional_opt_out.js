exports.up = function up(knex) {
  return knex.schema.alterTable("opt_out", (table) => {
    table.integer("assignment_id").nullable().alter();
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("opt_out", (table) => {
    table.integer("assignment_id").notNullable().alter();
  });
};
