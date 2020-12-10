exports.up = function (knex) {
  return knex.schema.raw(`
    create table password_reset_request (
      id serial primary key,
      email text,
      token text default encode(gen_random_bytes(10), 'hex'),
      used_at timestamptz,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      expires_at timestamptz default now() + interval '24 hours'
    );

    create index on password_reset_request (token);
  `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    drop table password_reset_request;
  `);
};
