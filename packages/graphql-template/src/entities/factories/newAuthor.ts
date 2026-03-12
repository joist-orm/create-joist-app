import { type DeepNew, EntityManager, FactoryOpts, newTestInstance } from "joist-orm";
import { Author } from "../Author";

export function newAuthor(em: EntityManager, opts?: FactoryOpts<Author>): DeepNew<Author> {
  return newTestInstance(em, Author, opts) as DeepNew<Author>;
}
