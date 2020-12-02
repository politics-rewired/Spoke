exports.up = function up(knex) {
  return knex.schema.createTable("team_escalation_tags", (table) => {
    table.integer("team_id").references("team(id)");
    table.integer("tag_id").references("tag(id)");

    table.index(["team_id", "tag_id"]);

    table.timestamps();
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable("team_escalation_tags");
};
