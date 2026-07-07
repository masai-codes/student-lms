#!/usr/bin/env bash
#
# One-shot local database setup:
#   1. Starts the MySQL 8.0.42 container and waits until it is healthy.
#   2. Downloads the shared dev dump and imports it.
#
# Intended entry point for new developers:
#
#   npm run db:setup
#
# Pass --refresh to force re-downloading the dump instead of using the cache.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found on your PATH." >&2
  echo "Install Docker Desktop (or the Docker engine) and try again." >&2
  exit 1
fi

echo "==> Starting MySQL 8.0.42 container..."
# --wait blocks until the service reports healthy via its healthcheck.
docker compose up -d --wait mysql

bash "$SCRIPT_DIR/seed-db.sh" "$@"

echo ""
echo "==> Local database is ready!"
echo "    Add this to your .env if you haven't already:"
echo "    DATABASE_URL=\"mysql://root:root@localhost:3306/lms_dev_db\""
