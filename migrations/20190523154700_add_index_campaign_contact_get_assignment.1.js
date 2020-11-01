// Add index for fetching current assignment target
exports.up = function up(knex) {
  return knex.schema.alterTable("campaign_contact", table => {
    table.index(
      ["campaign_id", "assignment_id", "message_status", "is_opted_out"],
      "campaign_contact_get_current_assignment_index"
    );
  });
};

// Drop index for fetching current assignment target
exports.down = function down(knex) {
  return knex.schema.alterTable("campaign_contact", table => {
    table.dropIndex(
      ["campaign_id, assignment_id, message_status, is_opted_out"],
      "campaign_contact_get_current_assignment_index"
    );
  });
};
