exports.up = function up(knex) {
  return knex.raw(`
    delete from opt_out oo
    using opt_out existing
    where oo.id > existing.id
      and oo.cell = existing.cell
      and oo.organization_id = existing.organization_id;

    alter table opt_out
      add constraint unique_cell_per_organization_id unique (cell, organization_id)
  `);
};

exports.down = function down(knex) {
  return knex.raw(`
    alter table opt_out
      drop constraint unique_cell_per_organization_id
  `);
};
