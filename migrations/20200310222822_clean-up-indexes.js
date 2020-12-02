exports.up = function up(knex) {
  return knex.schema.raw(`
    -- Swap order of cell, campaign_id in unique constraint
    alter table campaign_contact add constraint campaign_contact_cell_campaign_id_unique unique (cell, campaign_id);
    alter table campaign_contact drop constraint campaign_contact_campaign_id_cell_unique;

    -- Add partial index on archived = false for performance
    create index campaign_contact_partial_assignment_id_index on campaign_contact (assignment_id) where archived = false;

    -- Drop unused indexes that just slow down vacuuming
    drop index campaign_contact_timezone_index;
    drop index campaign_contact_assignment_id_index;
    drop index campaign_contact_cell_index;

    -- Drop this unused relationship in favor of campaign contact <> assignment
    alter table message drop constraint message_assignment_id_foreign;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    -- Restore message <> assignment relationship
    alter table message add constraint message_assignment_id_foreign foreign key (assignment_id) references assignment (id);

    -- Restore indexes
    create index campaign_contact_cell_index on campaign_contact (cell);
    create index campaign_contact_assignment_id_index on campaign_contact (assignment_id);
    create index campaign_contact_timezone_index on campaign_contact (timezone);

    -- Drop partial index on archived = false
    drop index campaign_contact_partial_assignment_id_index;

    -- Restore original ordering of unique constraint
    alter table campaign_contact add constraint campaign_contact_campaign_id_cell_unique unique (campaign_id, cell);
    alter table campaign_contact drop constraint campaign_contact_cell_campaign_id_unique;
  `);
};
