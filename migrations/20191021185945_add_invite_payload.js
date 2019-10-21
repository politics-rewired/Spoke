exports.up = function(knex) {
  return knex.schema.alterTable("invite", table => {
    table
      .json("payload")
      .notNullable()
      .default(JSON.stringify({}));
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("invite", table => {
    table.dropColumn("payload");
  });
};
