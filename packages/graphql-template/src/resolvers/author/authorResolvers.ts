import { Author } from "src/entities";
import type { AuthorResolvers } from "src/generated/graphql-types";
import { entityResolver } from "src/resolvers/utils";

export const authorResolvers: AuthorResolvers = { ...entityResolver(Author) };
