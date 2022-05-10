exports.up = function up(knex) {
  return knex.schema.alterTable("user", (table) => {
    table
      .enu("notification_frequency", ["ALL", "PERIODIC", "DAILY", "NONE"])
      .notNullable()
      .defaultTo("ALL");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("user", (table) => {
    table.dropColumn("notification_frequency");
  });
};
