exports.up = (knex) => {
  return knex.schema.raw(`
    alter table assignment
      add constraint assignment_unqiue_user_campaign unique (user_id, campaign_id);
  `);
};

exports.down = (knex) => {
  return knex.schema.raw(`
    alter table assignment
      drop constraint assignment_unqiue_user_campaign;
  `);
};
