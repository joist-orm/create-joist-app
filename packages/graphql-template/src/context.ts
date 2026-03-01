import { EntityManager, newPgConnectionConfig } from "joist-orm";
import { PostgresDriver } from "joist-orm/pg";
import { Pool } from "pg";

export interface Context {
  pool: Pool;
  em: EntityManager;
}

export function newContext(): Context {
  const pool = new Pool(newPgConnectionConfig());
  const em = new EntityManager({}, new PostgresDriver(pool));
  return { em, pool };
}
