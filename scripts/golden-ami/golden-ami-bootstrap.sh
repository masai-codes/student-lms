#!/bin/bash
# =============================================================================
# golden-ami-bootstrap.sh
#
# Runs INSIDE the builder EC2 instance as UserData.
# Do not run this script directly — it is invoked by golden-ami-build.sh.
#
# Installs: Node 24, pm2, jq, unzip, AWS CLI v2,
#           CodeDeploy agent, SSM agent, CloudWatch agent.
# =============================================================================
set -euo pipefail
exec > /var/log/golden-ami-build.log 2>&1

REGION="ap-south-1"
NODE_MAJOR="24"

echo "==> Waiting for any automatic apt locks to clear..."
# Fresh Ubuntu instances run unattended-upgrades on first boot, which holds the
# apt lock. Wait until it finishes before touching apt ourselves.
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1
systemd-run --property="After=apt-daily.service apt-daily-upgrade.service" \
  --wait /bin/true 2>/dev/null || true
for lock in /var/lib/dpkg/lock-frontend /var/lib/apt/lists/lock /var/cache/apt/archives/lock; do
  while fuser "$lock" >/dev/null 2>&1; do
    echo "    Waiting for $lock to be released..."
    sleep 5
  done
done

echo "==> Updating system packages..."
# Ubuntu ARM (ports) mirrors sometimes advertise a package version whose .deb
# was already removed from the pool (404). Refresh indexes and retry so a
# transient mirror mismatch does not abort the AMI build.
apt-get update -y
UPGRADE_OK=false
for attempt in 1 2 3; do
  if apt-get upgrade -y \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold" \
    --fix-missing; then
    UPGRADE_OK=true
    break
  fi
  echo "WARNING: apt upgrade failed (attempt ${attempt}/3); refreshing indexes..."
  apt-get update -y
  sleep 5
done
if [ "$UPGRADE_OK" != "true" ]; then
  echo "WARNING: apt upgrade did not fully succeed; continuing with base packages"
fi

echo "==> Installing Node.js ${NODE_MAJOR}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
apt-get install -y nodejs
node --version
npm --version

echo "==> Installing pm2..."
npm install -g pm2
pm2 --version

echo "==> Installing jq, unzip, and AWS CLI..."
apt-get install -y jq unzip
# Install the official AWS CLI v2 for ARM64
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp/awscliv2
/tmp/awscliv2/aws/install
aws --version

echo "==> Installing AWS CodeDeploy agent..."
apt-get install -y ruby-full wget
CODEDEPLOY_BUCKET="aws-codedeploy-${REGION}"
wget -q "https://${CODEDEPLOY_BUCKET}.s3.${REGION}.amazonaws.com/latest/install" -O /tmp/codedeploy-install
chmod +x /tmp/codedeploy-install
/tmp/codedeploy-install auto
systemctl enable codedeploy-agent
systemctl start codedeploy-agent
systemctl is-active --quiet codedeploy-agent \
  && echo "CodeDeploy agent is running" \
  || echo "WARNING: CodeDeploy agent failed to start"

echo "==> Ensuring Amazon SSM agent is running..."
# Ubuntu 22.04 AMIs ship with SSM agent pre-installed via snap.
# Installing the deb package on top of the snap causes a conflict.
# Just ensure the snap service is enabled and running.
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service || true
systemctl is-active --quiet snap.amazon-ssm-agent.amazon-ssm-agent.service \
  && echo "SSM agent is running" \
  || echo "WARNING: SSM agent failed to start"

echo "==> Installing Amazon CloudWatch agent (ARM64)..."
wget -q "https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/arm64/latest/amazon-cloudwatch-agent.deb" \
  -O /tmp/amazon-cloudwatch-agent.deb
dpkg -i /tmp/amazon-cloudwatch-agent.deb

echo "==> Writing CloudWatch agent config..."
mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
CW_AGENT_CONFIG="/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
STAGED_CONFIG="/tmp/cw-agent-config.json"
if [ -f "$STAGED_CONFIG" ]; then
  cp "$STAGED_CONFIG" "$CW_AGENT_CONFIG"
else
  echo "ERROR: CloudWatch agent config not staged at $STAGED_CONFIG"
  exit 1
fi

echo "==> Starting CloudWatch agent..."
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

echo "==> Creating app directories..."
mkdir -p /home/ubuntu/app
mkdir -p /home/ubuntu/logs
chown -R ubuntu:ubuntu /home/ubuntu/app
chown -R ubuntu:ubuntu /home/ubuntu/logs

echo "==> Enabling pm2 startup on boot for ubuntu user..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash || true

echo "==> Stopping agents cleanly before AMI snapshot..."
# Services must not be running at snapshot time — stale PID/lock files baked
# into the AMI cause agents to fail to start on first boot of new instances.
systemctl stop codedeploy-agent amazon-ssm-agent amazon-cloudwatch-agent || true
rm -f /var/run/codedeploy-agent.pid /var/lock/subsys/codedeploy-agent

echo "==> Cleaning up..."
apt-get autoremove -y
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/*

echo "==> Golden AMI bootstrap complete."
# Sentinel file — polled by golden-ami-build.sh to confirm bootstrap finished.
touch /var/lib/cloud/instance/bootstrap-complete
