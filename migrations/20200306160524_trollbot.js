exports.up = function(knex) {
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

      table.boolean("dismissed").default(false);
    }),
    knex.schema.createTable("troll_trigger", table => {
      table.string("token");
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable("troll_alarm"),
    knex.schema.dropTable("troll_trigger")
  ]);
};
