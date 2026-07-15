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
# shellcheck source=./lib/ecr.sh
source "$SCRIPT_DIR/lib/ecr.sh"

require_env BRANCH BASE_DOMAIN ALB_LISTENER_ARN

SAFE_BRANCH="$(sanitize_branch "$BRANCH")" || die "Unable to sanitize BRANCH=$BRANCH"
PORT_MAP_FILE="${PORT_MAP_FILE:-/var/lib/feature-env/branch-ports.map}"
DB_NAME="$(feature_db_name "$SAFE_BRANCH")"
CONTAINER_NAME="$(feature_container_name "$SAFE_BRANCH")"
TG_NAME="$(feature_tg_name "$SAFE_BRANCH")"
HOSTNAME="$(feature_hostname "$SAFE_BRANCH" "$BASE_DOMAIN")"
IMAGE_TAG="${ECR_REPO:-}:${SAFE_BRANCH}"

run_step() {
  local name="$1"
  shift
  if "$@"; then
    log "Teardown step succeeded: $name"
  else
    warn "Teardown step failed (continuing): $name"
  fi
}

run_step "delete listener rule" alb_delete_rule_if_exists "$ALB_LISTENER_ARN" "$HOSTNAME"
run_step "delete target group" alb_delete_target_group_if_exists "$TG_NAME"
run_step "remove container" stop_and_remove_container "$CONTAINER_NAME"
run_step "drop database" db_drop_if_exists "$DB_NAME"
run_step "remove port map" port_mapping_delete "$PORT_MAP_FILE" "$SAFE_BRANCH"

if [[ -n "${ECR_REPO:-}" ]]; then
  ECR_REPOSITORY_NAME="$(ecr_repository_name "$ECR_REPO")"
  run_step "optional ecr tag delete" aws ecr batch-delete-image --repository-name "$ECR_REPOSITORY_NAME" --image-ids "imageTag=${SAFE_BRANCH}" >/dev/null
else
  log "Skipping ECR deletion. Prefer lifecycle policies for registry cleanup."
fi
