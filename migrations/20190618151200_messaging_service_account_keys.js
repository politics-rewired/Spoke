// Add Twilio account_sid and encrypted_auth_token columns
exports.up = function up(knex) {
  return knex.schema.alterTable("messaging_service", (table) => {
    table.text("account_sid").notNullable().default("");
    table.text("encrypted_auth_token").notNullable().default("");
  });
};

// Remove Twilio account_sid and encrypted_auth_token columns
exports.down = function down(knex) {
  return knex.schema.alterTable("messaging_service", (table) => {
    table.dropColumn("account_sid");
    table.dropColumn("encrypted_auth_token");
  });
};
