exports.up = function(knex, Promise) {
  // Add stringified empty array as default
  return knex.schema.alterTable("message", table => {
    table
      .text("service_response")
      .defaultTo("[]")
      .alter();
  });
};

exports.down = function(knex, Promise) {
  // Revert to default of empty string
  return knex.schema.alterTable("message", table => {
    table
      .text("service_response")
      .defaultTo("")
      .alter();
  });
};
