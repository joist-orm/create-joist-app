import { enumResolvers } from "src/resolvers/enumResolvers";
import { mutationResolvers } from "src/resolvers/mutations";
import { objectResolvers } from "src/resolvers/objects";

export const resolvers = {
  ...enumResolvers,
  ...objectResolvers,
  Mutation: mutationResolvers,
};
