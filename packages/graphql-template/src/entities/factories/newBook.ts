import { type DeepNew, EntityManager, FactoryOpts, newTestInstance } from "joist-orm";
import { Book } from "../Book";

export function newBook(em: EntityManager, opts?: FactoryOpts<Book>): DeepNew<Book> {
  return newTestInstance(em, Book, opts) as DeepNew<Book>;
}
