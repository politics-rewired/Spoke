// Cascade deletes from parent interaction steps down to children
exports.up = function up(knex) {
  return knex.schema.alterTable("interaction_step", (table) => {
    table.dropForeign("parent_interaction_id");
    table
      .foreign("parent_interaction_id")
      .references("interaction_step.id")
      .onDelete("CASCADE");
  });
};

// Remove cascading deletes from interaction steps
exports.down = function down(knex) {
  return knex.schema.alterTable("interaction_step", (table) => {
    table.dropForeign("parent_interaction_id");
    table.foreign("parent_interaction_id").references("interaction_step.id");
  });
};
