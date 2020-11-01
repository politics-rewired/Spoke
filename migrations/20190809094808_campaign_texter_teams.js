exports.up = function up(knex) {
  const createTeamsTables = knex.schema
    .createTable("team", (table) => {
      table.increments("id").primary();
      table
        .integer("organization_id")
        .unsigned()
        .notNullable()
        .references("organization.id");
      table.text("title").notNullable();
      table.text("description").notNullable().default("");
      table.text("text_color").notNullable().default("#000000");
      table.text("background_color").notNullable().default("#000000");
      table.integer("assignment_priority").unsigned().default(500);
      table.integer("author_id").unsigned().references("user.id");
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

      table.unique(["title", "organization_id"]);
    })
    .then(() =>
      Promise.all([
        knex.schema.createTable("user_team", (table) => {
          table
            .integer("user_id")
            .unsigned()
            .references("user.id")
            .onDelete("CASCADE");
          table
            .integer("team_id")
            .unsigned()
            .references("team.id")
            .onDelete("CASCADE");
          table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
          table.unique(["user_id", "team_id"]);
        }),
        knex.schema.createTable("campaign_team", (table) => {
          table
            .integer("campaign_id")
            .unsigned()
            .references("campaign.id")
            .onDelete("CASCADE");
          table
            .integer("team_id")
            .unsigned()
            .references("team.id")
            .onDelete("CASCADE");
          table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
          table.unique(["campaign_id", "team_id"]);
        })
      ])
    );
  return Promise.all([
    createTeamsTables,
    knex.schema.alterTable("campaign", (table) => {
      table.boolean("limit_assignment_to_teams").notNullable().default(false);
      table.index("limit_assignment_to_teams");
    })
  ]);
};

exports.down = function down(knex) {
  const dropTeamsTables = Promise.all([
    knex.schema.dropTable("user_team"),
    knex.schema.dropTable("campaign_team")
  ]).then(() => knex.schema.dropTable("team"));

  return Promise.all([
    dropTeamsTables,
    knex.schema.alterTable("campaign", (table) => {
      table.dropColumn("limit_assignment_to_teams");
    })
  ]);
};
