exports.up = function(knex) {
  return knex.schema.raw(`
    create or replace function public.tg__user__backfill_superadmin_membership() returns trigger as $$
    begin
      insert into user_organization (user_id, organization_id, role)
      select
        NEW.id as user_id,
        organization.id as organization_id,
        'OWNER' as role
      from organization
      on conflict (user_id, organization_id)
        do update set role = EXCLUDED.role;

      return NEW;
    end;
    $$ language plpgsql;

    create trigger _500_backfill_superadmin_membership
      after update
      on public.user
      for each row
      when (NEW.is_superadmin and NEW.is_superadmin is distinct from OLD.is_superadmin)
      execute procedure tg__user__backfill_superadmin_membership();
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    drop trigger _500_backfill_superadmin_membership on public.user;

    drop function public.tg__user__backfill_superadmin_membership;
  `);
};
