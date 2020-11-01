exports.up = function up(knex) {
  return knex.schema.alterTable("campaign", (table) => {
    table.boolean("landlines_filtered").default(false);
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("campaign", (table) => {
    table.dropColumn("landlines_filtered");
  });
};
