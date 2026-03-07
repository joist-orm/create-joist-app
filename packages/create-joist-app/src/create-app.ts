import fs from "fs";
import path from "path";
import pc from "picocolors";
import { createDbDockerfile } from "./create-db-dockerfile";
import { createDockerCompose } from "./create-docker-compose";
import { createEnv } from "./create-env";
import { copyDirectory } from "./helpers/copy";
import type { PackageManager } from "./helpers/get-package-manager";
import { install } from "./helpers/install";
import { replaceSentinelValues } from "./replace-sentinels";
import { updatePackageJson } from "./update-package-json";

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
  createEnv(projectPath, { template, dbConfig });

  // Generate docker-compose.yml with user's DB config
  createDockerCompose(projectPath, dbConfig);

  // Generate db.dockerfile
  createDbDockerfile(projectPath);

  // Replace the template package name with the user's project name in all text files.
  // DB values are NOT replaced via sentinel matching (too fragile — "joist" appears in
  // package names). Instead, .env, docker-compose.yml, db.dockerfile, and package.json
  // scripts are all generated/updated inline above and below.
  replaceSentinelValues(projectPath, { [templatePkgName]: projectName });

  // Update package.json with project name and add scaffolding scripts
  updatePackageJson(projectPath, projectName);

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
