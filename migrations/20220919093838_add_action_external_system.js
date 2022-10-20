exports.up = function up(knex) {
  return knex.schema
    .createTable("action_external_system_sync", (table) => {
      table.increments("id").primary();

      table.integer("action_id").notNullable();
      table.enu("action_type", ["question_response", "opt_out"]).notNullable();
      table
        .enu("sync_status", [
          "CREATED",
          "SYNC_QUEUED",
          "SYNCED",
          "SYNC_FAILED",
          "SKIPPED"
        ])
        .notNullable()
        .defaultTo("CREATED");
      table.timestamp("synced_at");
      table.text("sync_error");
      table.json("extra_data");
      table.timestamps(true, true);
    })
    .then(() => {
      knex.schema.raw(`
      create trigger _500_action_external_system_sync_updated_at
        before update
        on public.action_external_system_sync
        for each row
        execute procedure universal_updated_at();
    `);
    });
};

exports.down = function down(knex) {
  return knex.schema.dropTable("action_external_system_sync");
};
