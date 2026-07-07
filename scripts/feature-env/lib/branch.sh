#!/usr/bin/env bash

sanitize_branch() {
  local raw="${1:-}"
  local safe

  safe="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g' | sed -E 's/^-+|-+$//g' | sed -E 's/-+/-/g')"
  safe="${safe:0:63}"
  safe="$(printf '%s' "$safe" | sed -E 's/^-+|-+$//g')"

  if [[ -z "$safe" ]]; then
    return 1
  fi

  printf '%s\n' "$safe"
}

feature_db_name() {
  printf 'demo_%s\n' "$1"
}

feature_container_name() {
  printf 'app_%s\n' "$1"
}

feature_tg_name() {
  local name="tg-$1"
  printf '%s\n' "${name:0:32}"
}

feature_hostname() {
  local safe_branch="$1"
  local base_domain="$2"
  printf '%s.%s\n' "$safe_branch" "$base_domain"
}

assert_no_sanitize_collision() {
  local raw_branch="$1"
  local safe_branch="$2"
  local file_path="$3"

  mkdir -p "$(dirname "$file_path")"
  touch "$file_path"

  local existing_raw
  existing_raw="$(awk -F'|' -v key="$safe_branch" '$1==key{print $2; exit}' "$file_path")"
  if [[ -n "$existing_raw" && "$existing_raw" != "$raw_branch" ]]; then
    printf 'Sanitize collision: "%s" and "%s" both map to "%s"\n' "$existing_raw" "$raw_branch" "$safe_branch" >&2
    return 1
  fi

  if [[ -z "$existing_raw" ]]; then
    printf '%s|%s\n' "$safe_branch" "$raw_branch" >>"$file_path"
  fi
}
