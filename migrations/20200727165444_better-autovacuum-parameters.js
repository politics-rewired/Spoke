exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table campaign_contact set (autovacuum_vacuum_scale_factor = 0, autovacuum_vacuum_threshold = 20000);
    alter table message set (autovacuum_vacuum_scale_factor = 0, autovacuum_vacuum_threshold = 20000);
    alter table messaging_service_stick set (autovacuum_vacuum_scale_factor = 0, autovacuum_vacuum_threshold = 20000);
    alter table assignment_request set (autovacuum_vacuum_scale_factor = 0, autovacuum_vacuum_threshold = 5000);
    alter table all_question_response set (autovacuum_vacuum_scale_factor = 0, autovacuum_vacuum_threshold = 2000);

    alter table public.campaign_contact set (fillfactor = 50);
    alter table public.message set (fillfactor = 50);
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table campaign_contact set (autovacuum_vacuum_scale_factor = 0.2, autovacuum_vacuum_threshold = 50);
    alter table message set (autovacuum_vacuum_scale_factor = 0.2, autovacuum_vacuum_threshold = 50);
    alter table messaging_service_stick set (autovacuum_vacuum_scale_factor = 0.2, autovacuum_vacuum_threshold = 50);
    alter table assignment_request set (autovacuum_vacuum_scale_factor = 0.2, autovacuum_vacuum_threshold = 50);
    alter table all_question_response set (autovacuum_vacuum_scale_factor = 0.2, autovacuum_vacuum_threshold = 50);

    alter table public.campaign_contact set (fillfactor = 100);
    alter table public.message set (fillfactor = 100);
  `);
};
