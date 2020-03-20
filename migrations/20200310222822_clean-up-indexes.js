exports.up = function(knex) {
  return knex.schema.raw(`
    create unique index campaign_contact_cell_campaign_id_unique on campaign_contact (cell, campaign_id);
    create index campaign_contact_partial_assignment_id_index on campaign_contact (assignment_id) where archived = false;

    drop index campaign_contact_campaign_id_cell_unique;
    drop index campaign_contact_timezone_index;
    drop index campaign_contact_assignment_id_index;
    drop index campaign_contact_cell_index;

    drop index message_assignment_id_foreign;
    alter table message drop constraint message_assignment_id_foreign;
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop index campaign_contact_cell_campaign_id_unique;
    drop index campaign_contact_partial_assignment_id_index;

    create index campaign_contact_campaign_id_cell_unique on campaign_contact (campaign_id, cell);
    create index campaign_contact_timezone_index on campaign_contact (timezone);
    create index campaign_contact_cell_index on campaign_contact (cell);
    create index campaign_contact_assignment_id_index on campaign_contact (assignment_id);

    create index message_assignment_id_foreign on message (assigment_id);
    alter table message add constraint message_assignment_id_foreign foreign key (assignment_id) references assignment (id);
  `);
};
