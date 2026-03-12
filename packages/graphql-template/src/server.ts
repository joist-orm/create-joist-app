import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchemaSync } from "@graphql-tools/load";
import path from "path";
import { Context, newAppContext } from "./context";
import { EntityManager } from "./entities";
import { resolvers } from "./resolvers";

const typeDefs = loadSchemaSync(path.join(__dirname, "./**/*.graphql"), {
  loaders: [new GraphQLFileLoader()],
});

async function main() {
  const appContext = newAppContext();
  const server = new ApolloServer<Context>({ typeDefs, resolvers });
  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PORT || "4000") },
    context: async () => {
      const ctx = { ...appContext, em: null as any } satisfies Context;
      const em = new EntityManager(ctx, appContext.driver);
      Object.assign(ctx, { em });
      return ctx;
    },
  });
  console.log(`🚀 Server ready at ${url}`);
}

main().catch(console.error);
