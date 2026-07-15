#!/usr/bin/env bash

mysql_exec() {
  local sql="$1"
  MYSQL_PWD="$MYSQL_ADMIN_PASS" mysql \
    -h "${MYSQL_ADMIN_HOST:-127.0.0.1}" \
    -P "${MYSQL_ADMIN_PORT:-3306}" \
    -u "$MYSQL_ADMIN_USER" \
    -N -B \
    -e "$sql"
}

db_table_count() {
  local db_name="$1"
  mysql_exec "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${db_name}';"
}

db_create_if_missing() {
  local db_name="$1"
  mysql_exec "CREATE DATABASE IF NOT EXISTS \`${db_name}\`;"
}

db_drop_if_exists() {
  local db_name="$1"
  mysql_exec "DROP DATABASE IF EXISTS \`${db_name}\`;"
}

db_was_empty_before_create() {
  local db_name="$1"
  local count
  count="$(db_table_count "$db_name" || echo 0)"
  [[ "$count" == "0" ]]
}
