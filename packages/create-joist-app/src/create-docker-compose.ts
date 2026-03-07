import fs from "fs";
import path from "path";
import type { DbConfig } from "./create-app";

export function createDockerCompose(projectPath: string, dbConfig: DbConfig): void {
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
}
