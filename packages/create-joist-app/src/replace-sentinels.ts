import fs from "fs";
import path from "path";

export function replaceSentinelValues(dirPath: string, replacements: Record<string, string>): void {
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
