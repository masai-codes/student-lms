#!/bin/bash
set -e

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
export HOME=/home/ubuntu

echo "[ApplicationStop] Gracefully stopping pm2 processes..."

# Check if pm2 is running any processes before attempting to stop.
if pm2 list 2>/dev/null | grep -q "student-lms"; then
  # Send SIGINT to allow Node/Nitro to finish in-flight requests.
  # kill_timeout in ecosystem.config.cjs is 15000ms — pm2 will SIGKILL after that.
  pm2 stop student-lms --kill-timeout 15000
  echo "[ApplicationStop] pm2 process stopped."
else
  echo "[ApplicationStop] No running pm2 process found. Skipping."
fi

echo "[ApplicationStop] Done."
