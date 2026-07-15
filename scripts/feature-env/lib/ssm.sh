#!/usr/bin/env bash

ssm_send_command() {
  local instance_id="$1"
  local command_text="$2"
  local comment="${3:-feature-env-command}"

  aws ssm send-command \
    --instance-ids "$instance_id" \
    --document-name "AWS-RunShellScript" \
    --comment "$comment" \
    --parameters "commands=$command_text" \
    --query 'Command.CommandId' \
    --output text
}

ssm_wait_command() {
  local command_id="$1"
  local instance_id="$2"
  aws ssm wait command-executed --command-id "$command_id" --instance-id "$instance_id"
}

ssm_get_output() {
  local command_id="$1"
  local instance_id="$2"
  aws ssm get-command-invocation \
    --command-id "$command_id" \
    --instance-id "$instance_id" \
    --query 'StandardOutputContent' \
    --output text
}
