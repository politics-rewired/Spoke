exports.up = function (knex) {
  return knex.schema.raw(`
    create table instance_setting (
      name text primary key,
      type text default 'string',
      value text not null
    );
 `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    drop table table instance_setting;
 `);
};
