exports.up = function(knex) {
  // Add stringified empty array as default
  return knex.schema.alterTable("message", table => {
    table
      .text("service_response")
      .defaultTo("[]")
      .alter();
  });
};

exports.down = function(knex) {
  // Revert to default of empty string
  return knex.schema.alterTable("message", table => {
    table
      .text("service_response")
      .defaultTo("")
      .alter();
  });
};
