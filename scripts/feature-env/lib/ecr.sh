#!/usr/bin/env bash

# ECR_REPO may be a full URI (recommended):
#   123456789012.dkr.ecr.ap-south-1.amazonaws.com/student-lms
# or a repository name (requires AWS_ACCOUNT_ID + AWS_REGION):
#   student-lms

ecr_account_from_uri() {
  local uri="${1%%:*}"
  printf '%s\n' "${uri%%.dkr.ecr.*}"
}

ecr_region_from_uri() {
  local uri="${1%%:*}"
  if [[ "$uri" =~ \.dkr\.ecr\.([a-z0-9-]+)\.amazonaws\.com ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
  fi
}

ecr_repo_name_from_uri() {
  local uri="${1%%:*}"
  printf '%s\n' "${uri##*/}"
}

ecr_normalize_repo_uri() {
  local repo="$1"
  if [[ "$repo" =~ \.dkr\.ecr\. ]]; then
    printf '%s\n' "${repo%%:*}"
    return 0
  fi
  require_env AWS_ACCOUNT_ID AWS_REGION
  printf '%s.dkr.ecr.%s.amazonaws.com/%s\n' "$AWS_ACCOUNT_ID" "$AWS_REGION" "$repo"
}

ecr_resolve_region() {
  local repo_uri="$1"
  local region
  region="$(ecr_region_from_uri "$repo_uri")"
  if [[ -n "$region" ]]; then
    printf '%s\n' "$region"
    return 0
  fi
  printf '%s\n' "${AWS_REGION:?AWS_REGION required when ECR_REPO is not a full URI}"
}

ecr_repository_name() {
  local repo="$1"
  if [[ "$repo" =~ \.dkr\.ecr\. ]]; then
    ecr_repo_name_from_uri "${repo%%:*}"
    return 0
  fi
  printf '%s\n' "$repo"
}

ecr_login() {
  local region="$1"
  local account_id="$2"
  aws ecr get-login-password --region "$region" \
    | docker login --username AWS --password-stdin "${account_id}.dkr.ecr.${region}.amazonaws.com"
}

ecr_build_and_push() {
  local repo_uri="$1"
  local tag="$2"
  local dockerfile="${3:-Dockerfile}"
  local context="${4:-.}"
  local full_image="${repo_uri}:${tag}"

  run_maybe docker build -f "$dockerfile" -t "$full_image" "$context"
  run_maybe docker push "$full_image"
  printf '%s\n' "$full_image"
}
