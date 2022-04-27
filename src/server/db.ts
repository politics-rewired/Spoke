import { Pool } from "pg";

import { config } from "../config";

const poolConfig = {
  connectionString: config.DATABASE_URL,
  max: config.WORKER_MAX_POOL
};

export const pgPool = new Pool(poolConfig);

export default pgPool;
