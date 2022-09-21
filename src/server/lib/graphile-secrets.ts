import Cryptr from "cryptr";
import type { Pool, PoolClient } from "pg";

import { config } from "../../config";
import { withClient } from "../utils";

export const cryptr = new Cryptr(config.SESSION_SECRET);

export const setSecret = async (
  client: PoolClient,
  ref: string,
  secret: string
) => {
  const encryptedSecret = cryptr.encrypt(secret);
  await client.query(
    `
      insert into graphile_secrets.secrets (ref, encrypted_secret)
      values ($1, $2)
      on conflict (ref) do update set encrypted_secret = EXCLUDED.encrypted_secret
    `,
    [ref, encryptedSecret]
  );
};

export const setSecretPool = (pool: Pool, ref: string, secret: string) =>
  withClient(pool, (client) => setSecret(client, ref, secret));

export const getSecret = async (client: PoolClient, ref: string) => {
  const {
    rows: [secret]
  } = await client.query<{ encrypted_secret: string }>(
    `
      select encrypted_secret
      from graphile_secrets.secrets
      where ref = $1
    `,
    [ref]
  );

  if (secret) {
    return cryptr.decrypt(secret.encrypted_secret);
  }
  return undefined;
};

export const getSecretPool = (pool: Pool, ref: string) =>
  withClient(pool, (client) => getSecret(client, ref));

export default cryptr;
