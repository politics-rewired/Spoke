exports.up = function(knex, Promise) {
  return knex.schema.alterTable("team", table => {
    table.boolean("enabled").default(false);
    table.enu("assignment_type", ["UNSENT", "UNREPLIED"]);
    table.integer("max_request_count");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("team", table => {
    table.dropColumn("enabled");
    table.dropColumn("assignment_type");
    table.dropColumn("max_request_count");
  });
};
