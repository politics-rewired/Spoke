exports.up = function up(knex) {
  return knex.schema.alterTable("messaging_service", (table) => {
    table.string("name").notNullable().default("");
    table.boolean("active").notNullable().default(true);

    table.index("active");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("messaging_service", (table) => {
    table.dropIndex("active");

    table.dropColumn("active");
    table.dropColumn("name");
  });
};
