exports.up = function (knex) {
  return knex.schema.raw(`
    create extension if not exists citext;
    alter table public.user alter column email type citext;

    with 
      duplicated_users as (
        select email
        from public.user
        group by 1
        having count(*) > 1
      ),
      user_assignment as (
        select 
          public.user.id as user_id,
          email,
          coalesce(
            max(assignment.created_at),
            public.user.updated_at
          ) as most_recent_assignment
        from public.user
        left join assignment on assignment.user_id = public.user.id
        where email in ( select email from duplicated_users )
        group by 1, 2
      ),
      keep_discard_user_pairs as (
        select duplicated_users.email, keep.user_id as keep_user_id, array_agg(discard.user_id) as discard_user_ids
        from duplicated_users
        join user_assignment as keep 
          on keep.user_id = (
            select user_id
            from user_assignment 
            where user_assignment.email = duplicated_users.email
            order by most_recent_assignment desc
            limit 1
          )
        join user_assignment as discard 
          on discard.user_id <> keep.user_id
          and discard.email = duplicated_users.email
        group by 1, 2
      ),
      lockout_old as (
        update public.user u
        set auth0_id = 'lockedout|deprecation',
            email = split_part(u.email, '@', 1) || '+deprecatedasduplicate' || split_part(u.email, '@', 2)
        from keep_discard_user_pairs
        where u.id = ANY(keep_discard_user_pairs.discard_user_ids)
        returning 1
      ),
      merged_org_memberships as (
        insert into user_organization (user_id, organization_id, role)
        select keep_user_id as user_id, organization_id, role
        from keep_discard_user_pairs
        join user_organization on user_organization.user_id = ANY(keep_discard_user_pairs.discard_user_ids)
        on conflict (user_id, organization_id)
        do update
        set role = (
          case 
            when excluded.updated_at > user_organization.updated_at then excluded.role
            else user_organization.role
          end
        )
        returning 1
      ),
      reassignments as (
        update assignment
        set user_id = keep_discard_user_pairs.keep_user_id
        from keep_discard_user_pairs
        where assignment.user_id = ANY(keep_discard_user_pairs.discard_user_ids)
        returning 1
      )
      select 
        ( select count(*) from lockout_old ) as lockout_count,
        ( select count(*) from merged_org_memberships ) as merged_org_memberships_count,
        ( select count(*) from reassignments ) as reassignments_count;

    alter table public.user add constraint email_unique unique (email);
  `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    alter table public.user drop constraint email_unique;
    alter table public.user alter column email type text;
  `);
};
