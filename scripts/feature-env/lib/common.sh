#!/usr/bin/env bash

set -euo pipefail

FEATURE_ENV_MANAGED_BY="${FEATURE_ENV_MANAGED_BY:-feature-env-ci}"

log() {
  printf '[feature-env] %s\n' "$*"
}

warn() {
  printf '[feature-env][warn] %s\n' "$*" >&2
}

die() {
  printf '[feature-env][error] %s\n' "$*" >&2
  exit 1
}

require_env() {
  local missing=()
  local key
  for key in "$@"; do
    if [[ -z "${!key:-}" ]]; then
      missing+=("$key")
    fi
  done
  if ((${#missing[@]} > 0)); then
    die "Missing required environment variables: ${missing[*]}"
  fi
}

retry() {
  local attempts="$1"
  local delay_seconds="$2"
  shift 2

  local i=1
  until "$@"; do
    if ((i >= attempts)); then
      return 1
    fi
    sleep "$delay_seconds"
    i=$((i + 1))
  done
}

run_maybe() {
  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    log "[dry-run] $*"
    return 0
  fi
  "$@"
}
