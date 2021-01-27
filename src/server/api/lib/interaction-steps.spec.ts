import { Pool, PoolClient } from "pg";

import { config } from "../../../config";

describe("persistInteractionStepTree", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    client = await pool.connect();
  });

  afterAll(async () => {
    if (client) client.release();
    if (pool) await pool.end();
  });

  test("removes deleted interaction steps");

  test("adds new interaction steps");

  test("updates modified interaction steps");
});
