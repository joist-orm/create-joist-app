import { type Entity, type EntityConstructor, type OptsOf, updatePartial } from "joist-orm";
import type { Context } from "src/context";

/**
 * Creates a resolver that maps GraphQL fields to entity fields/relations.
 * For simple entities where the GraphQL field names match entity field names.
 */
export function entityResolver<T extends Entity>(cstr: EntityConstructor<T>): Record<string, unknown> {
  return {};
}

/**
 * Saves an entity (create or update) from GraphQL mutation input.
 */
export async function saveEntity<T extends Entity>(
  ctx: Context,
  cstr: EntityConstructor<T>,
  input: Partial<OptsOf<T>> & { id?: string },
): Promise<T> {
  const em = ctx.em;
  let entity: T;
  if (input.id) {
    entity = await em.load(cstr, input.id);
    updatePartial(entity, input as any);
  } else {
    entity = em.createPartial(cstr, input as any);
  }
  await em.flush();
  return entity;
}
