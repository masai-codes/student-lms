#!/bin/bash
set -e

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"
export HOME=/home/ubuntu

echo "[ValidateService] Validating application health..."

MAX_RETRIES=20
RETRY_INTERVAL=5
HEALTH_URL="http://localhost:3000/api/health"

for i in $(seq 1 $MAX_RETRIES); do
  echo "[ValidateService] Health check attempt $i/$MAX_RETRIES..."

  HTTP_STATUS=$(curl -sf --max-time 5 -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

  if [ "$HTTP_STATUS" = "200" ]; then
    echo "[ValidateService] Health check passed (HTTP $HTTP_STATUS)."
    exit 0
  fi

  echo "[ValidateService] Health check returned HTTP $HTTP_STATUS. Retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "[ValidateService] ERROR: Health check failed after $MAX_RETRIES attempts."
echo "[ValidateService] Dumping pm2 logs for diagnosis:"
pm2 logs student-lms --nostream --lines 50 2>/dev/null || true

exit 1
