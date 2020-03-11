exports.up = function(knex) {
  return knex.schema.raw(`
    create index campaign_contact_partial_assignment_id_index (assignment_id) where archived = false;
    create unique index campaign_contact_cell_campaign_id_unique (cell, campaign_id);

    drop index campaign_contact_campaign_id_cell_unique;
    drop index campaign_contact_timezone_index;
    drop index campaign_contact_assignment_id_index;
    drop index campaign_contact_cell_index;
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop index campaign_contact_partial_assignment_id_index (assignment_id) where archived = false;
    drop index campaign_contact_cell_campaign_id_unique (cell, campaign_id);

    create index campaign_contact_campaign_id_cell_unique on campaign_contact (campaign_id, cell);
    create index campaign_contact_timezone_index on campaign_contact (timezone);
    create index campaign_contact_assignment_id_index on campaign_contact (assignment_id);
    create index campaign_contact_cell_index on campaign_contact (cell);
  `);
};
