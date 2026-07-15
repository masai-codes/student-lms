#!/usr/bin/env bash

container_exists() {
  local name="$1"
  docker ps -a --format '{{.Names}}' | awk -v n="$name" '$0==n{found=1} END{exit(found?0:1)}'
}

stop_and_remove_container() {
  local name="$1"
  if container_exists "$name"; then
    docker stop "$name" >/dev/null 2>&1 || true
    docker rm "$name" >/dev/null 2>&1 || true
  fi
}

run_feature_container() {
  local image="$1"
  local name="$2"
  local safe_branch="$3"
  local port="$4"
  local db_name="$5"

  docker run -d \
    --name "$name" \
    --network=host \
    --memory=512m --cpus=1 \
    -e PORT="$port" \
    -e DB_PORT="${APP_DB_PORT:-3306}" \
    -e DB_HOST="${APP_DB_HOST:-127.0.0.1}" \
    -e DB_USER="$APP_DB_USER" \
    -e DB_PASS="$APP_DB_PASS" \
    -e DB_NAME="$db_name" \
    -e DATABASE_URL="mysql://${APP_DB_USER}:${APP_DB_PASS}@${APP_DB_HOST:-127.0.0.1}:${APP_DB_PORT:-3306}/${db_name}" \
    --label "branch=$safe_branch" \
    --label "managed-by=$FEATURE_ENV_MANAGED_BY" \
    --restart unless-stopped \
    "$image"
}

wait_for_health() {
  local port="$1"
  local path="${2:-/health}"
  local attempts="${3:-30}"
  local delay="${4:-2}"
  local url="http://127.0.0.1:${port}${path}"

  local i=1
  while ((i <= attempts)); do
    if curl --silent --show-error --fail "$url" >/dev/null; then
      return 0
    fi
    sleep "$delay"
    i=$((i + 1))
  done

  return 1
}
