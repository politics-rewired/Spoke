import { Pool } from "pg";
import { Logger, runMigrations } from "graphile-worker";
import { migrate as migrateScheduler } from "graphile-scheduler/dist/migrate";

import { config } from "../src/config";
import logger from "../src/logger";

const main = async () => {
  const connectionString = config.isTest
    ? config.TEST_DATABASE_URL
    : config.DATABASE_URL;
  logger.info(
    `Using environment: ${config.NODE_ENV}. Migrating worker with connection string ${connectionString}`
  );
  const pool = new Pool({ connectionString });

  const logFactory = (scope) => (level, message, meta) =>
    logger.log({ level, message, ...meta, ...scope });
  const graphileLogger = new Logger(logFactory);

  await runMigrations({
    pgPool: pool,
    logger: graphileLogger
  });

  const client = await pool.connect();
  try {
    await migrateScheduler(
      {
        logger: graphileLogger
      },
      client
    );

    await client.query(`create schema if not exists graphile_secrets`);
    await client.query(`
      create table if not exists graphile_secrets.secrets (
        ref text primary key,
        encrypted_secret text
      )
    `);
    await client.query(`
      do $do$
      begin
        CREATE FUNCTION graphile_secrets.set_secret(ref text, unencrypted_secret text)
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
        exception
          when duplicate_function then
          null;
      end; $do$
    `);
  } finally {
    client.release();
  }

  await pool.end();
};

main()
  .then((result) => {
    logger.info("Finished migrating graphile-worker", { result });
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Error migrating graphile-worker", err);
    process.exit(1);
  });
