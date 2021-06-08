exports.up = function up(knex) {
  return knex.raw(`
    create table unsolicited_message (
      id serial primary key,
      messaging_service_sid text not null references public.messaging_service (messaging_service_sid),
      service_id text not null,
      from_number text not null,
      body text not null,
      num_segments int not null,
      num_media int not null,
      media_urls text[] not null default '{}',
      service_response json not null,
      created_at timestamptz not null default CURRENT_TIMESTAMP,
      updated_at timestamptz not null default CURRENT_TIMESTAMP
    );

    create trigger _500_message_updated_at
      before update
      on unsolicited_message
      for each row
      execute function universal_updated_at();
  `);
};

exports.down = function down(knex) {
  return knex.raw(`
    drop table unsolicited_message;
  `);
};
