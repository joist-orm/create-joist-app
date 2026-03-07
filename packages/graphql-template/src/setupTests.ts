import expect from "expect";
import { newPgConnectionConfig } from "joist-orm";
import { PostgresDriver } from "joist-orm/pg";
import { toMatchEntity } from "joist-orm/tests";
import pg from "pg";
import "src/setupIt";
import { Context } from "./context";
import { EntityManager } from "./entities";

expect.extend({ toMatchEntity });

let pool: pg.Pool;

beforeAll(async () => {
  pool = new pg.Pool(newPgConnectionConfig());
});

beforeEach(async () => {
  await pool.query("select flush_database()");
});

afterAll(async () => {
  await pool.end();
});

export function newEm(): EntityManager {
  const driver = new PostgresDriver(pool);
  const ctx = { pool, em: null as any } satisfies Context;
  const em = new EntityManager(ctx, driver);
  Object.assign(ctx, { em });
  return em;
}

export async function createTestContext(): Promise<Context> {
  const em = newEm();
  return em.ctx;
}
