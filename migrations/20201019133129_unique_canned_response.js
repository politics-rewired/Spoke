exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table canned_response
      add constraint unique_per_campaign unique (campaign_id, title);
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table canned_response drop constraint unique_per_campaign;
  `);
};
