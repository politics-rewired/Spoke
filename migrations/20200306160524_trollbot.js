exports.up = function up(knex) {
  return Promise.all([
    knex.schema.createTable("troll_alarm", table => {
      table
        .integer("message_id")
        .primary()
        .references("message(id)");

      table
        .string("trigger_token")
        .notNull()
        .index();

      table
        .boolean("dismissed")
        .default(false)
        .index();
    }),
    knex.schema.createTable("troll_trigger", table => {
      table.string("token").primary();
      table.integer("organization_id").references("organization(id)");
      table.index("organization_id");
    })
  ]);
};

exports.down = function down(knex) {
  return Promise.all([
    knex.schema.dropTable("troll_alarm"),
    knex.schema.dropTable("troll_trigger")
  ]);
};
