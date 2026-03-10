#!/bin/bash
set -e

# This script prepares template packages for npm publishing by copying them
# into the packages/create-joist-app/templates/ directory that gets included
# in the published npm package.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLI_DIR="$ROOT_DIR/packages/create-joist-app"
TEMPLATES_DIR="$CLI_DIR/templates"

EXCLUDE_DIRS="node_modules build .env src/entities/codegen src/generated"

# Copy a template package into the templates dir, excluding dev artifacts.
# Usage: copy_template <source_dir> <dest_dir>
copy_template() {
  local src="$1"
  local dest="$2"

  # Build find exclusion args
  local find_excludes=()
  for pattern in $EXCLUDE_DIRS; do
    find_excludes+=(-path "*/$pattern" -prune -o -path "*/$pattern/*" -prune -o)
  done
  # Also exclude *.tsbuildinfo files
  find_excludes+=(-name '*.tsbuildinfo' -prune -o)

  # Copy directory structure
  (cd "$src" && find . "${find_excludes[@]}" -type d -print) | while read -r dir; do
    mkdir -p "$dest/$dir"
  done

  # Copy files
  (cd "$src" && find . "${find_excludes[@]}" -type f -print) | while read -r file; do
    cp "$src/$file" "$dest/$file"
  done
}

echo "Preparing templates for publishing..."

# Clean and recreate templates dir
rm -rf "$TEMPLATES_DIR"
mkdir -p "$TEMPLATES_DIR/basic" "$TEMPLATES_DIR/graphql"

# Copy templates
copy_template "$ROOT_DIR/packages/basic-template" "$TEMPLATES_DIR/basic"
copy_template "$ROOT_DIR/packages/graphql-template" "$TEMPLATES_DIR/graphql"

# Rename .gitignore to gitignore (npm strips .gitignore during publish)
for dir in "$TEMPLATES_DIR/basic" "$TEMPLATES_DIR/graphql"; do
  if [ -f "$dir/.gitignore" ]; then
    mv "$dir/.gitignore" "$dir/gitignore"
  fi
done

echo "Templates prepared in $TEMPLATES_DIR"
