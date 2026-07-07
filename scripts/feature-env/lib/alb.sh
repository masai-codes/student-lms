#!/usr/bin/env bash

alb_find_target_group_arn() {
  local tg_name="$1"
  aws elbv2 describe-target-groups \
    --names "$tg_name" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null || true
}

alb_ensure_target_group() {
  local tg_name="$1"
  local port="$2"
  local vpc_id="$3"
  local health_path="$4"
  local safe_branch="$5"

  local tg_arn
  tg_arn="$(alb_find_target_group_arn "$tg_name")"
  if [[ -n "$tg_arn" && "$tg_arn" != "None" ]]; then
    printf '%s\n' "$tg_arn"
    return 0
  fi

  tg_arn="$(aws elbv2 create-target-group \
    --name "$tg_name" \
    --protocol HTTP \
    --port "$port" \
    --target-type instance \
    --vpc-id "$vpc_id" \
    --health-check-protocol HTTP \
    --health-check-path "$health_path" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)"

  aws elbv2 add-tags \
    --resource-arns "$tg_arn" \
    --tags "Key=managed-by,Value=$FEATURE_ENV_MANAGED_BY" "Key=branch,Value=$safe_branch" >/dev/null

  printf '%s\n' "$tg_arn"
}

alb_register_instance_target() {
  local tg_arn="$1"
  local instance_id="$2"
  local port="$3"
  aws elbv2 register-targets --target-group-arn "$tg_arn" --targets "Id=$instance_id,Port=$port" >/dev/null
}

alb_find_rule_arn_by_host() {
  local listener_arn="$1"
  local hostname="$2"
  aws elbv2 describe-rules \
    --listener-arn "$listener_arn" \
    --query "Rules[?contains(join('', Conditions[?Field=='host-header'].Values), '${hostname}')].RuleArn | [0]" \
    --output text 2>/dev/null || true
}

alb_ensure_rule_for_host() {
  local listener_arn="$1"
  local hostname="$2"
  local tg_arn="$3"
  local priority="$4"

  local rule_arn
  rule_arn="$(alb_find_rule_arn_by_host "$listener_arn" "$hostname")"
  if [[ -n "$rule_arn" && "$rule_arn" != "None" ]]; then
    printf '%s\n' "$rule_arn"
    return 0
  fi

  aws elbv2 create-rule \
    --listener-arn "$listener_arn" \
    --priority "$priority" \
    --conditions "Field=host-header,HostHeaderConfig={Values=[${hostname}]}" \
    --actions "Type=forward,TargetGroupArn=${tg_arn}" \
    --query 'Rules[0].RuleArn' \
    --output text
}

alb_delete_rule_if_exists() {
  local listener_arn="$1"
  local hostname="$2"
  local rule_arn
  rule_arn="$(alb_find_rule_arn_by_host "$listener_arn" "$hostname")"
  if [[ -n "$rule_arn" && "$rule_arn" != "None" ]]; then
    aws elbv2 delete-rule --rule-arn "$rule_arn" >/dev/null
  fi
}

alb_delete_target_group_if_exists() {
  local tg_name="$1"
  local tg_arn
  tg_arn="$(alb_find_target_group_arn "$tg_name")"
  if [[ -n "$tg_arn" && "$tg_arn" != "None" ]]; then
    aws elbv2 delete-target-group --target-group-arn "$tg_arn" >/dev/null
  fi
}
