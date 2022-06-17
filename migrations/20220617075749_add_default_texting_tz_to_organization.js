exports.up = function up(knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.string("default_texting_tz").notNullable().default("US/Eastern");
  });
};

exports.down = function down(knex) {
  return knex.schema.alterTable("organization", (table) => {
    table.dropColumn("default_texting_tz");
  });
};
