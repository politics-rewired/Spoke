exports.up = function up(knex) {
  return knex.schema.alterTable("campaign", (table) => {
    table.integer("replies_stale_after_minutes");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("campaign", (table) => {
    table.dropColumn("replies_stale_after_minutes");
  });
};
