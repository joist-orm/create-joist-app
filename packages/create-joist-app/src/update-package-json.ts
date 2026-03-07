import fs from "fs";
import path from "path";
export function updatePackageJson(projectPath: string, projectName: string): void {
  const pkgJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(pkgJsonPath)) return;

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  pkgJson.name = projectName;
  // Add db/migration scripts that reference the user's DB config
  pkgJson.scripts = {
    ...pkgJson.scripts,
    db: "docker compose up -d --wait db && yarn migrate && yarn codegen",
    redb: "docker compose exec db ./reset.sh && yarn migrate && yarn codegen",
    migrate: "env-cmd joist-pg-migrate",
    "migrate:new": "env-cmd joist-pg-migrate create",
  };
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
}
