#!/bin/bash
# =============================================================================
# golden-ami-build.sh
#
# One-time script to build the Golden AMI for student-lms EC2 instances.
# Run this locally (with AWS credentials) whenever you need to refresh the AMI
# (e.g. after OS patches or tool version upgrades).
#
# Prerequisites:
#   - AWS CLI configured with credentials for account 016530944324
#   - golden-ami-bootstrap.sh must be in the same directory as this script.
#   - The IAM instance profile "student-lms-ami-builder-profile" is created
#     automatically on first run if it doesn't exist.
#
# Usage:
#   chmod +x golden-ami-build.sh golden-ami-bootstrap.sh
#   ./golden-ami-build.sh
#
# Output:
#   Prints the new AMI ID at the end. Pass this as the GoldenAMIId parameter
#   when deploying or updating the CloudFormation stack.
# =============================================================================
set -euo pipefail

REGION="ap-south-1"
NODE_MAJOR="24"
AMI_NAME="student-lms-golden-ami-$(date +%Y%m%d-%H%M%S)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOTSTRAP_SCRIPT="$SCRIPT_DIR/golden-ami-bootstrap.sh"
CW_AGENT_CONFIG="$SCRIPT_DIR/../../config/cloudwatch/amazon-cloudwatch-agent.json"

if [ ! -f "$BOOTSTRAP_SCRIPT" ]; then
  echo "ERROR: golden-ami-bootstrap.sh not found at $BOOTSTRAP_SCRIPT"
  exit 1
fi

if [ ! -f "$CW_AGENT_CONFIG" ]; then
  echo "ERROR: CloudWatch agent config not found at $CW_AGENT_CONFIG"
  exit 1
fi

# IAM role/profile used only so the builder instance can be polled via SSM.
# It carries no application permissions.
BUILDER_ROLE_NAME="student-lms-ami-builder-role"
BUILDER_PROFILE_NAME="student-lms-ami-builder-profile"

# =============================================================================
# Ensure the minimal IAM role + instance profile exist for SSM polling
# =============================================================================
echo "==> Ensuring IAM builder role exists..."
if ! aws iam get-role --role-name "$BUILDER_ROLE_NAME" \
     --query 'Role.RoleName' --output text 2>/dev/null | grep -q "$BUILDER_ROLE_NAME"; then
  aws iam create-role \
    --role-name "$BUILDER_ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    --description "Minimal role for golden AMI builder instance (SSM access only)" \
    --query 'Role.RoleName' --output text
  aws iam attach-role-policy \
    --role-name "$BUILDER_ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
  echo "==> Created IAM role $BUILDER_ROLE_NAME"
else
  echo "==> IAM role $BUILDER_ROLE_NAME already exists."
fi

if ! aws iam get-instance-profile --instance-profile-name "$BUILDER_PROFILE_NAME" \
     --query 'InstanceProfile.InstanceProfileName' --output text 2>/dev/null | grep -q "$BUILDER_PROFILE_NAME"; then
  aws iam create-instance-profile --instance-profile-name "$BUILDER_PROFILE_NAME"
  aws iam add-role-to-instance-profile \
    --instance-profile-name "$BUILDER_PROFILE_NAME" \
    --role-name "$BUILDER_ROLE_NAME"
  echo "==> Created instance profile $BUILDER_PROFILE_NAME"
  echo "==> Waiting 10s for IAM to propagate..."
  sleep 10
else
  echo "==> Instance profile $BUILDER_PROFILE_NAME already exists."
fi

# =============================================================================
# Resolve base AMI
# =============================================================================
echo "==> Resolving latest Ubuntu 22.04 LTS ARM64 AMI in $REGION..."
BASE_AMI_ID=$(aws ec2 describe-images \
  --region "$REGION" \
  --owners 099720109477 \
  --filters \
    "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*" \
    "Name=state,Values=available" \
    "Name=architecture,Values=arm64" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
  --output text)

echo "==> Base AMI: $BASE_AMI_ID"

# =============================================================================
# Launch builder instance
# =============================================================================
echo "==> Preparing builder UserData with CloudWatch agent config..."
USERDATA_SCRIPT="$(mktemp)"
{
  echo '#!/bin/bash'
  echo 'set -euo pipefail'
  echo 'cat > /tmp/cw-agent-config.json << '\''CWCONFIG_EOF'\'''
  cat "$CW_AGENT_CONFIG"
  echo 'CWCONFIG_EOF'
  cat "$BOOTSTRAP_SCRIPT"
} > "$USERDATA_SCRIPT"
trap 'rm -f "$USERDATA_SCRIPT"' EXIT

echo "==> Launching builder instance..."
INSTANCE_ID=$(aws ec2 run-instances \
  --region "$REGION" \
  --image-id "$BASE_AMI_ID" \
  --instance-type "m7g.medium" \
  --associate-public-ip-address \
  --iam-instance-profile "Name=${BUILDER_PROFILE_NAME}" \
  --metadata-options "HttpTokens=required,HttpEndpoint=enabled" \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":20,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=golden-ami-builder},{Key=Purpose,Value=golden-ami-build}]" \
  --user-data "file://${USERDATA_SCRIPT}" \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "==> Builder instance launched: $INSTANCE_ID"
echo "==> Waiting for instance to be running..."
aws ec2 wait instance-running --region "$REGION" --instance-ids "$INSTANCE_ID"

# =============================================================================
# Poll via SSM until the sentinel file appears
# =============================================================================
echo "==> Waiting for SSM agent to come online on the builder instance..."
STATUS="None"
for i in $(seq 1 24); do
  STATUS=$(aws ssm describe-instance-information \
    --region "$REGION" \
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --query 'InstanceInformationList[0].PingStatus' \
    --output text 2>/dev/null || echo "None")
  if [ "$STATUS" = "Online" ]; then
    echo "==> SSM agent is online."
    break
  fi
  echo "    SSM not yet online (attempt $i/24, status=$STATUS) — waiting 15s..."
  sleep 15
done

if [ "$STATUS" != "Online" ]; then
  echo "ERROR: SSM agent never came online after 6 minutes."
  echo "  Instance ID: $INSTANCE_ID  (not terminated — inspect manually)"
  echo "  Check logs: aws ssm start-session --target $INSTANCE_ID"
  exit 1
fi

echo "==> Polling for bootstrap completion via SSM..."
BOOTSTRAP_DONE=false
for i in $(seq 1 60); do
  CMD_ID=$(aws ssm send-command \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=["test -f /var/lib/cloud/instance/bootstrap-complete && echo DONE || echo WAIT"]' \
    --query 'Command.CommandId' \
    --output text)
  sleep 5
  RESULT=$(aws ssm get-command-invocation \
    --region "$REGION" \
    --command-id "$CMD_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text 2>/dev/null || echo "WAIT")
  if echo "$RESULT" | grep -q "DONE"; then
    echo "==> Bootstrap complete (attempt $i)."
    BOOTSTRAP_DONE=true
    break
  fi
  echo "    Bootstrap still running (attempt $i/60) — waiting 15s..."
  sleep 15
done

if [ "$BOOTSTRAP_DONE" != "true" ]; then
  echo "ERROR: Bootstrap did not complete within ~15 minutes."
  echo "  Check logs: aws ssm start-session --target $INSTANCE_ID"
  echo "  Then: sudo tail -f /var/log/golden-ami-build.log"
  echo "  Instance $INSTANCE_ID not terminated — inspect manually."
  exit 1
fi

# =============================================================================
# Stop, snapshot, terminate
# =============================================================================
echo "==> Stopping instance before creating AMI..."
aws ec2 stop-instances --region "$REGION" --instance-ids "$INSTANCE_ID"
aws ec2 wait instance-stopped --region "$REGION" --instance-ids "$INSTANCE_ID"

echo "==> Creating AMI: $AMI_NAME..."
NEW_AMI_ID=$(aws ec2 create-image \
  --region "$REGION" \
  --instance-id "$INSTANCE_ID" \
  --name "$AMI_NAME" \
  --description "Student LMS Golden AMI - Ubuntu 22.04 ARM64, Node ${NODE_MAJOR}, pm2, CodeDeploy agent, CloudWatch agent, SSM agent" \
  --tag-specifications "ResourceType=image,Tags=[{Key=Name,Value=${AMI_NAME}},{Key=Project,Value=student-lms},{Key=NodeVersion,Value=${NODE_MAJOR}}]" \
  --query 'ImageId' \
  --output text)

echo "==> Waiting for AMI $NEW_AMI_ID to become available..."
aws ec2 wait image-available --region "$REGION" --image-ids "$NEW_AMI_ID"

echo "==> Terminating builder instance..."
aws ec2 terminate-instances --region "$REGION" --instance-ids "$INSTANCE_ID"

echo ""
echo "============================================================"
echo "  Golden AMI created successfully!"
echo "  AMI ID:   $NEW_AMI_ID"
echo "  AMI Name: $AMI_NAME"
echo ""
echo "  Pass this as the GoldenAMIId parameter when deploying"
echo "  or updating the CloudFormation stack:"
echo ""
echo "  aws cloudformation deploy \\"
echo "    --stack-name student-lms-production \\"
echo "    --parameter-overrides GoldenAMIId=$NEW_AMI_ID \\"
echo "    ..."
echo "============================================================"
