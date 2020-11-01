exports.up = function up(knex) {
  return knex.schema.raw(`
    create index campaign_contact_release_unhandled_replies_idx
      on campaign_contact (campaign_id, updated_at)
      with (fillfactor = 70)
      where
        message_status = 'needsResponse'
        and assignment_id is not null;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    drop index campaign_contact_release_unhandled_replies_idx;
  `);
};
