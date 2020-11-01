exports.up = function up(knex) {
  return knex.schema.alterTable("team", table => {
    table.boolean("is_assignment_enabled").default(false);
    table.enu("assignment_type", ["UNSENT", "UNREPLIED"]);
    table.integer("max_request_count");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("team", table => {
    table.dropColumn("is_assignment_enabled");
    table.dropColumn("assignment_type");
    table.dropColumn("max_request_count");
  });
};
