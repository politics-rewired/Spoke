/**
 * To clean up existing service responses, run the SQL in this PR:
 *
 * https://github.com/politics-rewired/Spoke/pull/289#issue-318906142
 */

exports.up = function up(knex) {
  // Add stringified empty array as default
  return knex.schema.alterTable("message", table => {
    table
      .text("service_response")
      .defaultTo("[]")
      .alter();
  });
};

exports.down = function down(knex) {
  // Revert to default of empty string
  return knex.schema.alterTable("message", table => {
    table
      .text("service_response")
      .defaultTo("")
      .alter();
  });
};
