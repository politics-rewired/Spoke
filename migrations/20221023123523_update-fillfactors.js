/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function up(knex) {
  return knex.schema.raw(`
    alter table public.message set (fillfactor = 85);
    alter table public.campaign_contact set (fillfactor = 85);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table public.campaign_contact set (fillfactor = 50);
    alter table public.message set (fillfactor = 50);
  `);
};
