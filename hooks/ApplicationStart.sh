#!/bin/bash
set -e

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
# CodeDeploy runs hooks without a login shell so HOME is not set.
# pm2 uses HOME to locate its daemon socket (~/.pm2) — without it pm2 fails.
export HOME=/home/ubuntu

echo "[ApplicationStart] Starting application via pm2..."

APP_DIR="/home/ubuntu/app"

# Ensure the log directory exists (hook runs as ubuntu, no chown needed).
mkdir -p /home/ubuntu/logs

# If pm2 already has the app registered, reload it (zero-downtime).
# Otherwise, start it fresh from the ecosystem config.
if pm2 list 2>/dev/null | grep -q "student-lms"; then
  echo "[ApplicationStart] Reloading existing pm2 process..."
  pm2 reload "$APP_DIR/ecosystem.config.cjs" --update-env
else
  echo "[ApplicationStart] Starting fresh pm2 process..."
  pm2 start "$APP_DIR/ecosystem.config.cjs"
fi

# Persist pm2 process list so it survives instance reboots.
pm2 save

echo "[ApplicationStart] Application started."
echo "[ApplicationStart] Done."
