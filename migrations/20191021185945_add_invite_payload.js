exports.up = function up(knex) {
  return knex.schema.alterTable("invite", table => {
    table
      .json("payload")
      .notNullable()
      .default(JSON.stringify({}));
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("invite", table => {
    table.dropColumn("payload");
  });
};
