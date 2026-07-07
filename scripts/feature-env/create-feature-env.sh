#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
# shellcheck source=./lib/branch.sh
source "$SCRIPT_DIR/lib/branch.sh"
# shellcheck source=./lib/port.sh
source "$SCRIPT_DIR/lib/port.sh"
# shellcheck source=./lib/db.sh
source "$SCRIPT_DIR/lib/db.sh"
# shellcheck source=./lib/docker.sh
source "$SCRIPT_DIR/lib/docker.sh"
# shellcheck source=./lib/alb.sh
source "$SCRIPT_DIR/lib/alb.sh"

require_env BRANCH APP_DB_USER APP_DB_PASS MYSQL_ADMIN_USER MYSQL_ADMIN_PASS ALB_LISTENER_ARN ECR_REPO PORT_RANGE_START PORT_RANGE_END VPC_ID EC2_INSTANCE_ID BASE_DOMAIN

SAFE_BRANCH="$(sanitize_branch "$BRANCH")" || die "Unable to sanitize BRANCH=$BRANCH"
PORT_MAP_FILE="${PORT_MAP_FILE:-/var/lib/feature-env/branch-ports.map}"
BRANCH_MAP_FILE="${BRANCH_MAP_FILE:-/var/lib/feature-env/safe-branch-map.txt}"

assert_no_sanitize_collision "$BRANCH" "$SAFE_BRANCH" "$BRANCH_MAP_FILE" || die "Unsafe sanitize collision"
PORT="$(allocate_branch_port "$SAFE_BRANCH" "$PORT_RANGE_START" "$PORT_RANGE_END" "$PORT_MAP_FILE")" || die "No free ports available in range"

DB_NAME="$(feature_db_name "$SAFE_BRANCH")"
CONTAINER_NAME="$(feature_container_name "$SAFE_BRANCH")"
TG_NAME="$(feature_tg_name "$SAFE_BRANCH")"
HOSTNAME="$(feature_hostname "$SAFE_BRANCH" "$BASE_DOMAIN")"
IMAGE_TAG="${ECR_REPO}:${SAFE_BRANCH}"
HEALTHCHECK_PATH="${HEALTHCHECK_PATH:-/health}"
RULE_PRIORITY="${RULE_PRIORITY:-$((100 + (PORT % 40000)))}"

log "SAFE_BRANCH=$SAFE_BRANCH PORT=$PORT DB_NAME=$DB_NAME"

# Optional build/push hook so teams can skip this if image is already built.
if [[ "${SKIP_IMAGE_BUILD:-0}" != "1" ]]; then
  run_maybe docker build -t "$IMAGE_TAG" .
  run_maybe docker push "$IMAGE_TAG"
fi

# Detect first create by checking table count before CREATE DATABASE IF NOT EXISTS.
was_empty_before=0
if db_was_empty_before_create "$DB_NAME"; then
  was_empty_before=1
fi
run_maybe db_create_if_missing "$DB_NAME"

# Run migration/seed only when schema is newly created/empty.
if [[ "$was_empty_before" == "1" ]]; then
  log "Fresh schema detected for $DB_NAME"
  if [[ -n "${MIGRATION_CMD:-}" ]]; then
    DATABASE_URL="mysql://${APP_DB_USER}:${APP_DB_PASS}@${MYSQL_ADMIN_HOST:-127.0.0.1}:${MYSQL_ADMIN_PORT:-3306}/${DB_NAME}" run_maybe bash -lc "$MIGRATION_CMD"
  fi
  if [[ -n "${SEED_CMD:-}" ]]; then
    DATABASE_URL="mysql://${APP_DB_USER}:${APP_DB_PASS}@${MYSQL_ADMIN_HOST:-127.0.0.1}:${MYSQL_ADMIN_PORT:-3306}/${DB_NAME}" run_maybe bash -lc "$SEED_CMD"
  fi
else
  log "Existing schema detected; skipping migration+seed"
fi

run_maybe stop_and_remove_container "$CONTAINER_NAME"
run_maybe run_feature_container "$IMAGE_TAG" "$CONTAINER_NAME" "$SAFE_BRANCH" "$PORT" "$DB_NAME"

if [[ "${DRY_RUN:-0}" != "1" ]]; then
  retry 30 2 wait_for_health "$PORT" "$HEALTHCHECK_PATH" || die "Container failed health checks"
fi

TG_ARN="$(alb_ensure_target_group "$TG_NAME" "$PORT" "$VPC_ID" "$HEALTHCHECK_PATH" "$SAFE_BRANCH")"
run_maybe alb_register_instance_target "$TG_ARN" "$EC2_INSTANCE_ID" "$PORT"
run_maybe alb_ensure_rule_for_host "$ALB_LISTENER_ARN" "$HOSTNAME" "$TG_ARN" "$RULE_PRIORITY" >/dev/null

log "Preview URL: https://${HOSTNAME}"
