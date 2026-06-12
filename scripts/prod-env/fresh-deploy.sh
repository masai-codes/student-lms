#!/usr/bin/env bash
# Fresh production deployment for student-lms.
# Region: ap-south-1   Account: 016530944324
# NOTE: Replace the GoldenAMIId placeholder below with the ARM64 Golden AMI ID
#       built in the production account via scripts/golden-ami/build.sh before running.

aws cloudformation deploy --stack-name student-lms-prod --template-file cloudformation.yml --capabilities CAPABILITY_NAMED_IAM\
  --parameter-overrides \
  GoldenAMIId=<REPLACE_WITH_PROD_GOLDEN_AMI_ID> \
  RDSInstanceIdentifier=msi-experience \
  SecretsManagerARN=arn:aws:secretsmanager:ap-south-1:016530944324:secret:prod/student-lms-prod-ssqA4U \
  ACMCertificateARNRegional=arn:aws:acm:ap-south-1:016530944324:certificate/23c7139a-ae42-4b85-b56a-92c0b7efd56e \
  ACMCertificateARNCloudFront=arn:aws:acm:us-east-1:016530944324:certificate/ca368ef5-069e-4f1c-8730-e5e3bc505417 \
  HostedZoneId=Z0182996VBEVAGTG3F6U \
  DomainName=learn.masaischool.com \
  GitHubConnection=arn:aws:codestar-connections:ap-south-1:016530944324:connection/71493bbf-615c-48c1-adc5-fbb0e15ecffa \
  GitHubBranch=pre-prod-cloudformation \
  --region=ap-south-1 \
  --s3-bucket=cdk-hnb659fds-assets-016530944324-ap-south-1
