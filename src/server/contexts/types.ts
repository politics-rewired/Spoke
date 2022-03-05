import { Knex } from "knex";

import type { Memoizer } from "../types";

export interface SpokeDbContext {
  schema: string;
  primary: Knex;
  reader: Knex;
}

export interface SpokeContext {
  db: SpokeDbContext;
  memoizer: Memoizer;
}

export interface SpokeRequestContext extends SpokeContext {
  user: any;
  loaders: any;
}
