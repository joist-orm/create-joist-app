import { newPgConnectionConfig } from "joist-orm";
import { PostgresDriver } from "joist-orm/pg";
import { Pool } from "pg";
import type { EntityManager } from "./entities";

/** The app-wide global context, created once on boot & shared across all requests. */
export interface AppContext {
  pool: Pool;
  driver: PostgresDriver;
}

/** The request-specific context, created once per request. */
export interface RequestContext extends AppContext {
  em: EntityManager;
}

export type Context = RequestContext;

export function newAppContext(): AppContext {
  const pool = new Pool(newPgConnectionConfig());
  const driver = new PostgresDriver(pool);
  return { pool, driver };
}
