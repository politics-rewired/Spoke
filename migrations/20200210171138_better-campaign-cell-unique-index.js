exports.up = function(knex) {
  return knex.schema.raw(`
    create unique index campaign_contact_cell_campaign_id_unique on campaign_contact (cell, campaign_id) 
    drop index campaign_contact_campaign_id_cell_unique;
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    create unique index camapign_contact_campaign_id_cell_unique on campaign_contact (campaign_id, cell);
    drop index campaign_contact_cell_campaign_id_unique;
  `);
};
