#!/bin/bash
set -e

# This script prepares template packages for npm publishing by copying them
# into the packages/create-joist-app/templates/ directory that gets included
# in the published npm package.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLI_DIR="$ROOT_DIR/packages/create-joist-app"
TEMPLATES_DIR="$CLI_DIR/templates"

echo "Preparing templates for publishing..."

# Clean and recreate templates dir
rm -rf "$TEMPLATES_DIR"
mkdir -p "$TEMPLATES_DIR/basic" "$TEMPLATES_DIR/graphql"

# Copy basic-template (excluding dev artifacts)
rsync -a --exclude='node_modules' --exclude='build' --exclude='.env' \
  --exclude='*.tsbuildinfo' --exclude='src/entities/codegen' \
  --exclude='src/generated' \
  "$ROOT_DIR/packages/basic-template/" "$TEMPLATES_DIR/basic/"

# Copy graphql-template (excluding dev artifacts)
rsync -a --exclude='node_modules' --exclude='build' --exclude='.env' \
  --exclude='*.tsbuildinfo' --exclude='src/entities/codegen' \
  --exclude='src/generated' \
  "$ROOT_DIR/packages/graphql-template/" "$TEMPLATES_DIR/graphql/"

# Rename .gitignore to gitignore (npm strips .gitignore during publish)
for dir in "$TEMPLATES_DIR/basic" "$TEMPLATES_DIR/graphql"; do
  if [ -f "$dir/.gitignore" ]; then
    mv "$dir/.gitignore" "$dir/gitignore"
  fi
done

echo "Templates prepared in $TEMPLATES_DIR"
