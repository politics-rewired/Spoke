exports.up = function up(knex) {
  return knex.raw(`
    alter table tag rename to all_tag;
    alter table all_tag add column deleted_at timestamp;
    create index all_tag_deleted_at_idx on all_tag ((deleted_at is null));

    create view tag as
      select *
      from all_tag
      where deleted_at is null;

    create or replace function soft_delete_tag() returns trigger as $$
    begin
      update all_tag
      set deleted_at = now()
      where all_tag.id = OLD.id;

      return OLD;
    end; $$ language plpgsql;

    create trigger _500_soft_delete_tag
      instead of delete
      on tag
      for each row
      execute procedure soft_delete_tag();
  `);
};

exports.down = function down(knex) {
  // Note - dropping the view also drops the trigger
  return knex.raw(`
    drop view tag cascade;
    alter table all_tag rename to tag;
    alter table tag drop column deleted_at;

    drop function soft_delete_tag;
  `);
};
