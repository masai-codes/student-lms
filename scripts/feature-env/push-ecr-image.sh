#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
# shellcheck source=./lib/branch.sh
source "$SCRIPT_DIR/lib/branch.sh"
# shellcheck source=./lib/ecr.sh
source "$SCRIPT_DIR/lib/ecr.sh"

require_env ECR_REPO

REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
DOCKER_CONTEXT="${DOCKER_CONTEXT:-$REPO_ROOT}"

TAG="${IMAGE_TAG:-}"
if [[ -z "$TAG" && -n "${BRANCH:-}" ]]; then
  TAG="$(sanitize_branch "$BRANCH")" || die "Unable to sanitize BRANCH=$BRANCH"
fi
TAG="${TAG:-latest}"

REPO_URI="$(ecr_normalize_repo_uri "$ECR_REPO")"
REGION="$(ecr_resolve_region "$REPO_URI")"
ACCOUNT_ID="$(ecr_account_from_uri "$REPO_URI")"
FULL_IMAGE="${REPO_URI}:${TAG}"

log "Building and pushing ${FULL_IMAGE}"

if [[ "${SKIP_ECR_LOGIN:-0}" != "1" ]]; then
  run_maybe ecr_login "$REGION" "$ACCOUNT_ID"
fi

if [[ "${SKIP_BUILD:-0}" == "1" ]]; then
  run_maybe docker push "$FULL_IMAGE"
else
  FULL_IMAGE="$(ecr_build_and_push "$REPO_URI" "$TAG" "$DOCKERFILE" "$DOCKER_CONTEXT")"
fi

log "Image ready: ${FULL_IMAGE}"
