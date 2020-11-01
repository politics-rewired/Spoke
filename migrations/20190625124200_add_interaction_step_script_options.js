// Add script_options column to interaction_step
exports.up = function up(knex) {
  return knex.schema
    .alterTable("interaction_step", table => {
      table.specificType("script_options", "text ARRAY").nullable();
    })
    .then(() =>
      // Backfill values
      knex("interaction_step").update({
        script_options: knex.raw("ARRAY[script]")
      })
    )
    .then(() =>
      // Make not nullable
      knex.schema.alterTable("interaction_step", table => {
        table
          .specificType("script_options", "text ARRAY")
          .notNullable()
          .alter();
      })
    )
    .then(() =>
      knex.schema.alterTable("interaction_step", table => {
        table.dropColumn("script");
      })
    );
};

// Drop script_options column to interaction_step
exports.down = function down(knex) {
  return knex.schema
    .alterTable("interaction_step", table => {
      table
        .text("script")
        .notNullable()
        .defaultTo("");
    })
    .then(() =>
      knex("interaction_step").update({
        script: knex.raw("script_options[1]") // Postgres is indexed from 1 https://stackoverflow.com/a/47384220
      })
    )
    .then(() =>
      knex.schema.alterTable("interaction_step", table => {
        table.dropColumn("script_options");
      })
    );
};
