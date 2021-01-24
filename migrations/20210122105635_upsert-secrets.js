exports.up = function (knex) {
  return knex.schema.raw(`
    DROP FUNCTION graphile_secrets.set_secret;
    CREATE OR REPLACE FUNCTION graphile_secrets.set_secret(secret_ref text, unencrypted_secret text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'graphile_secrets'
    AS $$ 
    begin
      insert into secrets (ref)
      values (set_secret.secret_ref)
      on conflict (ref) do nothing;

      insert into unencrypted_secrets (ref, unencrypted_secret)
      values (set_secret.secret_ref, set_secret.unencrypted_secret);

      return secret_ref;
    end;
    $$;
 `);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    DROP FUNCTION graphile_secrets.set_secret;
    CREATE OR REPLACE FUNCTION graphile_secrets.set_secret(ref text, unencrypted_secret text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'graphile_secrets'
    AS $$ 
    begin
      insert into secrets (ref)
      values (set_secret.ref);

      insert into unencrypted_secrets (ref, unencrypted_secret)
      values (set_secret.secret_ref, set_secret.unencrypted_secret);

      return ref;
    end;
    $$;
 `);
};
