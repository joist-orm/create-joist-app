import fs from "fs";
import path from "path";
import type { CreateAppOptions } from "./create-app";

export function createEnv(projectPath: string, options: Pick<CreateAppOptions, "template" | "dbConfig">): void {
  const { template, dbConfig } = options;
  const envContent =
    template === "graphql"
      ? `DATABASE_URL=postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}\nPORT=4000\n`
      : `DATABASE_URL=postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}\n`;
  fs.writeFileSync(path.join(projectPath, ".env"), envContent);
}
