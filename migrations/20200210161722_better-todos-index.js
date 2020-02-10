exports.up = function(knex) {
  return knex.schema.raw(`
    create index new_todos_partial_idx on campaign_contact (assignment_id, message_status, timezone, is_opted_out) where archived = false;
    drop index todos_partial_idx;
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    create index todos_partial_idx on campaign_contact (campaign_id, assignment_id, message_status, is_opted_out) where (archived = false);
    drop index todos_partial_idx;
  `);
};
