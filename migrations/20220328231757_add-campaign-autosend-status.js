exports.up = (knex) => {
  return knex.schema.raw(`
    alter table campaign add column autosend_status text default 'unstarted'
      check (autosend_status in ( 'unstarted', 'sending', 'paused', 'complete' ));
    
    alter table campaign add column autosend_user_id integer references public.user (id);
  `);
};

exports.down = (knex) => {
  return knex.schema.raw(`
    alter table campaign drop column autosend_status;
    alter table campaign drop column autosend_user_id;
  `);
};
