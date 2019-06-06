// Add index for fetching current assignment target
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.createTable("messaging_service", t => {
      t.text("messaging_service_sid").index(); // if we choose not to have the foreign key on sticks, we won't need the index here
      t.integer("organization_id")
        .references("organization(id)")
        .index();
    }),
    knex.createTable("messaging_service_stick", t => {
      t.text("cell");
      t.integer("organization_id")
        .references("organization(id)")
        .index();
      t.text("messaging_service_sid").references(
        "messaging_service(messaging_service_sid)"
      ); // for performance, we may want to skip the foreign key
      t.index(
        ["cell", "organization_id"],
        "messaging_service_stick_cell_organization_index"
      );
      t.unique(
        ["cell", "organization_id"],
        "messaging_service_stick_cell_organization_unique_constraint"
      );
    })
  ]);
};

// Drop index for fetching current assignment target
exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable("messaging_service"),
    knex.schema.dropTable("messaging_service_stick")
  ]);
};
