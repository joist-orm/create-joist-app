import { EntityManager, FactoryOpts, newTestInstance } from "joist-orm";
import { Author } from "../entities";

export function newAuthor(em: EntityManager, opts?: FactoryOpts<Author>): Author {
  return newTestInstance(em, Author, opts);
}
