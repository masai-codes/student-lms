#!/usr/bin/env bash

port_range_size() {
  local start="$1"
  local end="$2"
  if ((end < start)); then
    return 1
  fi
  printf '%s\n' "$((end - start + 1))"
}

branch_hash_u32() {
  local input="$1"
  cksum <<<"$input" | awk '{print $1}'
}

deterministic_port() {
  local safe_branch="$1"
  local start="$2"
  local end="$3"
  local span
  span="$(port_range_size "$start" "$end")" || return 1
  local hash
  hash="$(branch_hash_u32 "$safe_branch")"
  printf '%s\n' "$((start + (hash % span)))"
}

port_mapping_get() {
  local map_file="$1"
  local safe_branch="$2"
  [[ -f "$map_file" ]] || return 1
  awk -F'=' -v key="$safe_branch" '$1==key{print $2; exit}' "$map_file"
}

port_mapping_set() {
  local map_file="$1"
  local safe_branch="$2"
  local port="$3"
  mkdir -p "$(dirname "$map_file")"
  touch "$map_file"
  awk -F'=' -v key="$safe_branch" -v value="$port" '
    BEGIN { updated=0 }
    $1==key { print key "=" value; updated=1; next }
    { print $0 }
    END { if (!updated) print key "=" value }
  ' "$map_file" >"${map_file}.tmp" && mv "${map_file}.tmp" "$map_file"
}

port_mapping_delete() {
  local map_file="$1"
  local safe_branch="$2"
  [[ -f "$map_file" ]] || return 0
  awk -F'=' -v key="$safe_branch" '$1!=key{print $0}' "$map_file" >"${map_file}.tmp" && mv "${map_file}.tmp" "$map_file"
}

is_port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$port )" | grep -Eq ":$port\\b"
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP -sTCP:LISTEN -nP | grep -Eq ":$port\\b"
    return $?
  fi
  return 1
}

allocate_branch_port() {
  local safe_branch="$1"
  local start="$2"
  local end="$3"
  local map_file="$4"

  local existing
  existing="$(port_mapping_get "$map_file" "$safe_branch" || true)"
  if [[ -n "$existing" ]]; then
    printf '%s\n' "$existing"
    return 0
  fi

  local span
  span="$(port_range_size "$start" "$end")" || return 1
  local base
  base="$(deterministic_port "$safe_branch" "$start" "$end")"

  local candidate="$base"
  local i=0
  while ((i < span)); do
    local used_by
    used_by="$(awk -F'=' -v p="$candidate" '$2==p{print $1; exit}' "$map_file" 2>/dev/null || true)"
    if [[ -z "$used_by" ]] && ! is_port_in_use "$candidate"; then
      port_mapping_set "$map_file" "$safe_branch" "$candidate"
      printf '%s\n' "$candidate"
      return 0
    fi
    candidate=$((start + ((candidate - start + 1) % span)))
    i=$((i + 1))
  done

  return 1
}
