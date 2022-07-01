exports.up = function up(knex) {
  return knex.schema.raw(`
alter table campaign_variable
drop constraint check_name;

update campaign_variable
set name = concat('cv:', name);

alter table campaign_variable
add constraint check_name
check (name ~ '^cv:[a-zA-Z0-9 \\-_]+$');
`);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
alter table campaign_variable
drop constraint check_name;

update campaign_variable
set name = replace(name, 'cv:', '');

alter table campaign_variable
add constraint check_name
check (name ~ '^[a-zA-Z0-9 \\-_]+$');
`);
};
