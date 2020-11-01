// Add index on message.created_at
exports.up = function up(knex) {
  return knex.schema.alterTable("message", table => {
    table.index("created_at");
  });
};

// Drop index on message.created_at
exports.down = function down(knex) {
  return knex.schema.alterTable("message", table => {
    table.dropIndex("created_at");
  });
};
