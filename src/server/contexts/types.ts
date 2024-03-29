import type { Knex } from "knex";
import type { Memoizer } from "memoredis";

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
