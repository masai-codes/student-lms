#!/bin/bash
set -e

# CodeDeploy runs hooks with a minimal PATH. Expand it to cover standard
# locations for aws CLI and other system binaries.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"

echo "[AfterInstall] Fetching secrets from AWS Secrets Manager..."

IMDS_TOKEN=$(curl -sf --max-time 2 -X PUT \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 60" \
  http://169.254.169.254/latest/api/token)
REGION=$(curl -sf --max-time 2 \
  -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
  http://169.254.169.254/latest/meta-data/placement/region)

# SECRETS_MANAGER_ARN is injected as an environment variable by CodeDeploy
# via the deployment group environment configuration.
if [ -z "$SECRETS_MANAGER_ARN" ]; then
  echo "[AfterInstall] ERROR: SECRETS_MANAGER_ARN environment variable is not set."
  exit 1
fi

# Fetch the secret JSON blob from Secrets Manager.
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --region "$REGION" \
  --secret-id "$SECRETS_MANAGER_ARN" \
  --query 'SecretString' \
  --output text)

if [ -z "$SECRET_JSON" ]; then
  echo "[AfterInstall] ERROR: Failed to fetch secret from Secrets Manager."
  exit 1
fi

echo "[AfterInstall] Secrets fetched successfully. Writing to .env.production.local..."

# Write each key=value pair from the JSON blob into .env.production.local.
# Uses jq to parse the JSON and emit KEY=VALUE lines.
ENV_FILE="/home/ubuntu/app/.env.production.local"

echo "$SECRET_JSON" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > "$ENV_FILE"

# Secure the file — readable only by the ubuntu user.
chmod 0600 "$ENV_FILE"
chown ubuntu:ubuntu "$ENV_FILE"

echo "[AfterInstall] Secrets written to $ENV_FILE"

# ── Fix ownership of all deployed files ──────────────────────────────────────
chown -R ubuntu:ubuntu /home/ubuntu/app

echo "[AfterInstall] Done."
