#!/usr/bin/env bash
#
# Downloads the shared dev database dump and imports it into the local MySQL
# container defined in docker-compose.yml.
#
# The dump is cached under scripts/db/.cache so re-runs are fast. Pass
# --refresh to force a fresh download.
#
#   bash scripts/db/seed-db.sh
#   bash scripts/db/seed-db.sh --refresh

set -euo pipefail

# Resolve the repo root (two levels up from this script) so the command works
# regardless of the directory it is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Load MYSQL_* overrides from .env if present.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

DUMP_URL="https://lms-dev-db-dumps.s3.ap-south-1.amazonaws.com/latest/lms_dev_db.sql.gz"
CACHE_DIR="$SCRIPT_DIR/.cache"
DUMP_FILE="$CACHE_DIR/lms_dev_db.sql.gz"

MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root}"
MYSQL_DATABASE="${MYSQL_DATABASE:-lms_dev_db}"

REFRESH=false
if [ "${1:-}" = "--refresh" ]; then
  REFRESH=true
fi

mkdir -p "$CACHE_DIR"

if [ "$REFRESH" = true ] && [ -f "$DUMP_FILE" ]; then
  echo "==> --refresh passed, removing cached dump"
  rm -f "$DUMP_FILE"
fi

if [ -f "$DUMP_FILE" ]; then
  echo "==> Using cached dump: $DUMP_FILE"
  echo "    (run with --refresh to re-download the latest dump)"
else
  echo "==> Downloading seed dump from S3..."
  # Download to a temp file first so an interrupted download never leaves a
  # corrupt file in the cache.
  curl -fL --progress-bar -o "$DUMP_FILE.tmp" "$DUMP_URL"
  mv "$DUMP_FILE.tmp" "$DUMP_FILE"
fi

echo "==> Verifying the container is up..."
if ! docker compose ps --status running --services | grep -q '^mysql$'; then
  echo "MySQL container is not running. Start it first with: npm run db:up" >&2
  exit 1
fi

echo "==> Importing dump into database '$MYSQL_DATABASE' (this can take a while)..."
# Ensure the target database exists, then stream the (gzipped) dump straight
# into the mysql client inside the container. -T disables the pseudo-tty so the
# pipe works correctly.
docker compose exec -T mysql sh -c \
  "exec mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" -e 'CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\`;'"

gunzip -c "$DUMP_FILE" | docker compose exec -T mysql sh -c \
  "exec mysql -uroot -p\"$MYSQL_ROOT_PASSWORD\" \"$MYSQL_DATABASE\""

echo "==> Done. Database '$MYSQL_DATABASE' is seeded and ready."
