import fs from "fs";
import path from "path";
import type { DbConfig } from "./create-app";

export function updatePackageJson(projectPath: string, projectName: string, dbConfig: DbConfig): void {
  const pkgJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return;

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  pkgJson.name = projectName;
  // Add db/migration scripts that reference the user's DB config
  pkgJson.scripts = {
    ...pkgJson.scripts,
    db: "docker compose up -d db && yarn db-wait && yarn migrate && yarn codegen",
    redb: "docker compose exec db ./reset.sh && yarn migrate && yarn codegen",
    "db-wait": `node -e "const { execSync } = require('child_process'); let i = 0; while (i++ < 30) { try { execSync('docker compose exec db pg_isready -U ${dbConfig.user}', { stdio: 'ignore' }); process.exit(0); } catch { require('child_process').execSync('sleep 1'); } } process.exit(1);"`,
    migrate: "env-cmd joist-pg-migrate",
    "migrate:new": "env-cmd joist-pg-migrate create",
  };
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
}
