import fs from "fs";
import path from "path";
import pc from "picocolors";
import { copyDirectory } from "./helpers/copy";
import type { PackageManager } from "./helpers/get-package-manager";
import { install } from "./helpers/install";

export interface DbConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  name: string;
}

export interface CreateAppOptions {
  projectPath: string;
  projectName: string;
  template: "basic" | "graphql";
  packageManager: PackageManager;
  skipInstall: boolean;
  dbConfig: DbConfig;
}

const templateNameMap: Record<string, string> = {
  basic: "basic-template",
  graphql: "graphql-template",
};

/** Directories/files to skip when copying templates to a new project. */
const SKIP_ENTRIES = new Set(["node_modules", "build", "codegen", ".env", ".tsbuildinfo"]);

export async function createApp(options: CreateAppOptions): Promise<void> {
  const { projectPath, projectName, template, packageManager, skipInstall, dbConfig } = options;

  // Determine template directory - check for published templates/ first, then packages/
  const templatePkgName = templateNameMap[template];
  let templateDir = path.join(__dirname, "..", "templates", template);
  if (!fs.existsSync(templateDir)) {
    // Dev mode: templates live in sibling packages
    templateDir = path.join(__dirname, "..", "..", templatePkgName);
  }

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template "${template}" not found`);
  }

  console.log(`Using template: ${pc.cyan(template)}`);
  console.log(`Using package manager: ${pc.cyan(packageManager)}`);
  console.log();

  // Copy template files (skipping dev-only dirs)
  console.log("Copying template files...");
  copyDirectory(templateDir, projectPath, SKIP_ENTRIES);

  // Rename .gitignore handling: the template package has .gitignore,
  // but npm publish strips it; also check for "gitignore" fallback
  const gitignorePath = path.join(projectPath, "gitignore");
  const dotGitignorePath = path.join(projectPath, ".gitignore");
  if (fs.existsSync(gitignorePath) && !fs.existsSync(dotGitignorePath)) {
    fs.renameSync(gitignorePath, dotGitignorePath);
  }

  // Generate .env file with user's DB config
  const envContent =
    template === "graphql"
      ? `DATABASE_URL=postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}\nPORT=4000\n`
      : `DATABASE_URL=postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}\n`;
  fs.writeFileSync(path.join(projectPath, ".env"), envContent);

  // Generate docker-compose.yml with user's DB config
  const dockerCompose = `services:
  db:
    build:
      context: .
      dockerfile: db.dockerfile
    ports:
      - "${dbConfig.port}:5432"
    environment:
      POSTGRES_USER: ${dbConfig.user}
      POSTGRES_PASSWORD: ${dbConfig.password}
      POSTGRES_DB: ${dbConfig.name}
    command: ["postgres", "-c", "fsync=off", "-c", "log_statement=all"]
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbConfig.user} -d ${dbConfig.name}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  db_data:
`;
  fs.writeFileSync(path.join(projectPath, "docker-compose.yml"), dockerCompose);

  // Generate db.dockerfile
  const dbDockerfile = `FROM postgres:16

# Script to reset the database
RUN echo '#!/bin/bash\\nset -e\\npsql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL\\n  DROP DATABASE IF EXISTS "$POSTGRES_DB";\\n  CREATE DATABASE "$POSTGRES_DB";\\nEOSQL' > /docker-entrypoint-initdb.d/reset.sh \\
    && chmod +x /docker-entrypoint-initdb.d/reset.sh

# Copy reset script to accessible location
RUN echo '#!/bin/bash\\nset -e\\npsql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL\\n  DROP DATABASE IF EXISTS "$POSTGRES_DB";\\n  CREATE DATABASE "$POSTGRES_DB";\\nEOSQL' > /reset.sh \\
    && chmod +x /reset.sh

# Console script for easy database access
RUN echo '#!/bin/bash\\npsql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > /console.sh \\
    && chmod +x /console.sh
`;
  fs.writeFileSync(path.join(projectPath, "db.dockerfile"), dbDockerfile);

  // Replace the template package name with the user's project name in all text files.
  // DB values are NOT replaced via sentinel matching (too fragile — "joist" appears in
  // package names). Instead, .env, docker-compose.yml, db.dockerfile, and package.json
  // scripts are all generated/updated inline above and below.
  replaceSentinelValues(projectPath, { [templatePkgName]: projectName });

  // Update package.json with project name and add scaffolding scripts
  const pkgJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
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

  // Add package manager specific files
  if (packageManager === "yarn") {
    fs.writeFileSync(path.join(projectPath, ".yarnrc.yml"), "nodeLinker: node-modules\n");
  }

  // Install dependencies
  if (!skipInstall) {
    console.log();
    console.log("Installing dependencies...");
    console.log();
    await install(packageManager, projectPath);
  }
}

function replaceSentinelValues(dirPath: string, replacements: Record<string, string>): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "codegen") {
        replaceSentinelValues(fullPath, replacements);
      }
    } else if (isTextFile(entry.name)) {
      let content = fs.readFileSync(fullPath, "utf-8");
      let modified = false;

      for (const [sentinel, replacement] of Object.entries(replacements)) {
        if (content.includes(sentinel)) {
          content = content.split(sentinel).join(replacement);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

function isTextFile(filename: string): boolean {
  const textExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".env",
    ".gitignore",
    ".dockerignore",
    ".sql",
    ".graphql",
    ".gql",
    ".sh",
    ".template",
  ];

  const basename = path.basename(filename).toLowerCase();

  if (basename === "dockerfile" || basename === "db.dockerfile" || basename === "gitignore" || basename === ".env") {
    return true;
  }

  const ext = path.extname(filename).toLowerCase();
  return textExtensions.includes(ext);
}
