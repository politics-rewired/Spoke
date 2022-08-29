import faker from "faker";
import type { PoolClient } from "pg";

import type { ExternalResultCode } from "../../src/api/external-result-code";
import type { ExternalSystem } from "../../src/api/external-system";
import type {
  ExternalResultCodeRecord,
  ExternalSystemRecord
} from "../../src/server/api/types";

export type CreateExternalSystemOptions = Partial<
  Pick<ExternalSystem, "name" | "username" | "syncedAt"> & {
    type: string;
    apiKeyRef: string;
  }
> & { organizationId: number };

export const createExternalSystem = async (
  client: PoolClient,
  options: CreateExternalSystemOptions
) =>
  client
    .query<ExternalSystemRecord>(
      `
        insert into public.external_system (name, type, api_key_ref, organization_id, username, synced_at)
        values ($1, $2, $3, $4, $5, $6)
        returning *
      `,
      [
        options.name ?? faker.company.companyName(),
        options.type ?? "van",
        options.apiKeyRef ?? "dummy",
        options.organizationId,
        options.username ?? faker.internet.userName(),
        options.syncedAt ?? faker.date.recent()
      ]
    )
    .then(({ rows: [system] }) => system);

export type CreateExternalResultCodeOptions = Pick<
  ExternalResultCode,
  "systemId"
> &
  Partial<
    Pick<ExternalResultCode, "externalId" | "name" | "mediumName" | "shortName">
  >;

export const createExternalResultCode = async (
  client: PoolClient,
  options: CreateExternalResultCodeOptions
) =>
  client
    .query<ExternalResultCodeRecord>(
      `
        insert into public.external_result_code (system_id, external_id, name, medium_name, short_name)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [
        options.systemId,
        options.externalId ?? faker.random.number(),
        options.name ?? faker.random.word(),
        options.mediumName ?? faker.random.word(),
        options.shortName ?? faker.random.word()
      ]
    )
    .then(({ rows: [resultCode] }) => resultCode);
