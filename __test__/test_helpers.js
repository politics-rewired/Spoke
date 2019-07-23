import { createLoaders, dropTables, r } from "../src/server/models/";
import { sleep } from "../src/workers/lib";

export async function setupTest() {
  return r.k.migrate.latest();
}

export async function cleanupTest() {
  await dropTables();
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders()
  };
}
