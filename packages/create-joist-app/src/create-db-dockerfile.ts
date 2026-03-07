import fs from "fs";
import path from "path";

export function createDbDockerfile(projectPath: string): void {
  const dbDockerfile = `FROM postgres:18

# Script to reset the database
COPY <<'EOF' /docker-entrypoint-initdb.d/reset.sh
#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  DROP DATABASE IF EXISTS "$POSTGRES_DB";
  CREATE DATABASE "$POSTGRES_DB";
EOSQL
EOF
RUN chmod +x /docker-entrypoint-initdb.d/reset.sh

# Copy reset script to accessible location
COPY <<'EOF' /reset.sh
#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  DROP DATABASE IF EXISTS "$POSTGRES_DB";
  CREATE DATABASE "$POSTGRES_DB";
EOSQL
EOF
RUN chmod +x /reset.sh

# Console script for easy database access
COPY <<'EOF' /console.sh
#!/bin/bash
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
EOF
RUN chmod +x /console.sh
`;
  fs.writeFileSync(path.join(projectPath, "db.dockerfile"), dbDockerfile);
}
