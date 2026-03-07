import type { MutationResolvers } from "src/generated/graphql-types";
import { saveAuthor } from "src/resolvers/author/saveAuthorMutation";
import { saveBook } from "src/resolvers/book/saveBookMutation";

// This file is auto-generated

export const mutationResolvers: MutationResolvers = { ...saveAuthor, ...saveBook };
