#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
# shellcheck source=./lib/branch.sh
source "$SCRIPT_DIR/lib/branch.sh"

require_env GITHUB_REPOSITORY GITHUB_TOKEN BASE_DOMAIN ALB_LISTENER_ARN

fetch_open_pr_safe_branches() {
  local api_url="https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100"
  curl --silent --show-error --fail \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    "$api_url" | jq -r '.[].head.ref' | while read -r branch; do
      sanitize_branch "$branch" || true
    done | sort -u
}

list_managed_container_branches() {
  docker ps -a --filter "label=managed-by=$FEATURE_ENV_MANAGED_BY" --format '{{.Labels}}' \
    | tr ',' '\n' | awk -F'=' '$1=="branch"{print $2}' | sort -u
}

list_demo_db_branches() {
  MYSQL_PWD="$MYSQL_ADMIN_PASS" mysql \
    -h "${MYSQL_ADMIN_HOST:-127.0.0.1}" -P "${MYSQL_ADMIN_PORT:-3306}" -u "$MYSQL_ADMIN_USER" -N -B \
    -e "SHOW DATABASES LIKE 'demo\\_%';" | sed -E 's/^demo_//' | sort -u
}

list_managed_tg_branches() {
  aws elbv2 describe-target-groups --query 'TargetGroups[].TargetGroupArn' --output text \
    | tr '\t' '\n' | while read -r arn; do
      [[ -z "$arn" ]] && continue
      aws elbv2 describe-tags --resource-arns "$arn" \
        --query "TagDescriptions[0].Tags[?Key=='managed-by' || Key=='branch']" --output text \
        | awk 'NR==1{managed=$3} NR==2{branch=$3} END{if (managed=="'"$FEATURE_ENV_MANAGED_BY"'" && branch!="") print branch}'
    done | sort -u
}

open_pr_file="$(mktemp)"
orphans_file="$(mktemp)"
fetch_open_pr_safe_branches >"$open_pr_file"

{
  list_managed_container_branches
  list_demo_db_branches
  list_managed_tg_branches
} | sort -u >"$orphans_file"

while read -r branch; do
  [[ -z "$branch" ]] && continue
  if ! grep -Fxq "$branch" "$open_pr_file"; then
    log "Orphan detected: $branch"
    BRANCH="$branch" BASE_DOMAIN="$BASE_DOMAIN" ALB_LISTENER_ARN="$ALB_LISTENER_ARN" \
      MYSQL_ADMIN_USER="${MYSQL_ADMIN_USER:-}" MYSQL_ADMIN_PASS="${MYSQL_ADMIN_PASS:-}" \
      MYSQL_ADMIN_HOST="${MYSQL_ADMIN_HOST:-127.0.0.1}" MYSQL_ADMIN_PORT="${MYSQL_ADMIN_PORT:-3306}" \
      ECR_REPO="${ECR_REPO:-}" \
      bash "$SCRIPT_DIR/teardown-feature-env.sh" || warn "Cleanup failed for orphan branch: $branch"
  fi
done <"$orphans_file"

rm -f "$open_pr_file" "$orphans_file"
log "Orphan cleanup completed."
