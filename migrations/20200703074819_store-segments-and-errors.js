exports.up = function(knex) {
  return knex.schema.raw(`
    alter table message add column errors text[];
    alter table message add column num_segments smallint;
    alter table message add column num_media smallint;
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    alter table message drop column errors;
    alter table message drop column num_segments;
    alter table message drop column num_media;
  `);
};
