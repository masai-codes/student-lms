#!/bin/bash
set -e

# CodeDeploy runs hooks with a minimal PATH. Expand it to cover standard
# locations for aws CLI and other system binaries.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin"

echo "[BeforeInstall] Starting pre-install checks..."

# ── Spot interruption check ──────────────────────────────────────────────────
# If this instance has received a spot termination notice, exit 0 immediately.
# CodeDeploy will skip this instance rather than marking the deployment failed.
IMDS_TOKEN=$(curl -sf --max-time 2 -X PUT \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 60" \
  http://169.254.169.254/latest/api/token)
TERMINATION_TIME=$(curl -sf --max-time 2 \
  -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
  http://169.254.169.254/latest/meta-data/spot/termination-time 2>/dev/null || true)

if [ -n "$TERMINATION_TIME" ]; then
  echo "[BeforeInstall] Spot interruption notice detected (termination at $TERMINATION_TIME). Skipping deployment on this instance."

  # Immediately deregister from the ALB target group to stop receiving traffic.
  INSTANCE_ID=$(curl -sf --max-time 2 \
    -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
    http://169.254.169.254/latest/meta-data/instance-id)
  REGION=$(curl -sf --max-time 2 \
    -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" \
    http://169.254.169.254/latest/meta-data/placement/region)

  # Resolve all target group ARNs this instance is registered in and deregister.
  TG_ARNS=$(aws elbv2 describe-target-health \
    --region "$REGION" \
    --query "TargetHealthDescriptions[?Target.Id=='$INSTANCE_ID'].TargetGroupArn" \
    --output text 2>/dev/null || true)

  for TG_ARN in $TG_ARNS; do
    echo "[BeforeInstall] Deregistering $INSTANCE_ID from $TG_ARN"
    aws elbv2 deregister-targets \
      --region "$REGION" \
      --target-group-arn "$TG_ARN" \
      --targets "Id=$INSTANCE_ID" 2>/dev/null || true
  done

  # Exit 0 — tells CodeDeploy this instance succeeded (skip), not failed.
  exit 0
fi

# ── Clean previous deployment ────────────────────────────────────────────────
echo "[BeforeInstall] No spot interruption. Cleaning previous deployment artifacts..."

# Remove old server bundle but preserve the .env file and logs.
rm -rf /home/ubuntu/app/.output
rm -rf /home/ubuntu/app/hooks
# ecosystem.config.cjs will be overwritten by the new deployment files.

# Ensure required directories exist.
mkdir -p /home/ubuntu/app/.output/server
mkdir -p /home/ubuntu/logs
chown -R ubuntu:ubuntu /home/ubuntu/app
chown -R ubuntu:ubuntu /home/ubuntu/logs

echo "[BeforeInstall] Done."
