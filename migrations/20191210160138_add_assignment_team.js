exports.up = function up(knex) {
  return knex.schema.alterTable("assignment_request", table => {
    // no foreign key here because general (-1) maps to no team
    table.integer("preferred_team_id");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("assignment_request", table => {
    table.dropColumn("preferred_team_id");
  });
};
