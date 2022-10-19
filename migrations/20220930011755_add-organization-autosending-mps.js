exports.up = function up(knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.integer("autosending_mps");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.dropColumn("autosending_mps");
  });
};
