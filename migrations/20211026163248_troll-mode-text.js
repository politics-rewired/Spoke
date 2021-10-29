exports.up = function up(knex) {
  return knex.schema.raw(`
    create or replace function regconfig_mode (mode text) returns regconfig
    as $$
    begin
      return cast(mode as regconfig);
    end
    $$
    language plpgsql immutable;

    alter table public.troll_trigger
      drop column compiled_tsquery,
      alter column mode type text,
      alter column mode set default 'english',
      add column compiled_tsquery tsquery generated always as (to_tsquery(regconfig_mode(mode), token::text)) stored;
  `);
};

exports.down = function down(knex) {
  return knex.schema.raw(`
    alter table public.troll_trigger
      drop column compiled_tsquery,
      alter column mode drop default,
      alter column mode type regconfig using regconfig_mode(mode),
      alter column mode set default 'english'::regconfig,
      add column compiled_tsquery tsquery generated always as (to_tsquery(mode, token::text)) stored;

    drop function regconfig_mode (text);
  `);
};
