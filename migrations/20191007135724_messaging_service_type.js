exports.up = function up(knex) {
  return Promise.all([
    // Create enum type
    knex.schema
      .raw(
        `create type messaging_service_type as enum ('twilio', 'assemble-numbers');`
      )
      .then(() =>
        // Add service_type column with default
        knex.schema.alterTable("messaging_service", table => {
          table
            .specificType("service_type", "messaging_service_type")
            .notNullable()
            .defaultTo("twilio");
        })
      )
      .then(() =>
        // Drop the default
        knex.schema.alterTable("messaging_service", table => {
          table
            .specificType("service_type", "messaging_service_type")
            .notNullable()
            .alter();
          table.index("service_type");
        })
      ),
    // Add index on messaging_service_stick.messaging_service_sid for one-to-many lookup
    knex.schema.alterTable("messaging_service_stick", table => {
      table.index(["messaging_service_sid"]);
    })
  ]);
};

exports.down = function down(knex) {
  return Promise.all([
    // Drop column and service_type enum
    knex.schema
      .alterTable("messaging_service", table => {
        table.dropIndex("service_type");
        table.dropColumn("service_type");
      })
      .then(() => knex.schema.raw(`drop type messaging_service_type;`)),
    // Drop index on messaging_service_stick.messaging_service_sid
    knex.schema.alterTable("messaging_service_stick", table => {
      table.dropIndex(["messaging_service_sid"]);
    })
  ]);
};
