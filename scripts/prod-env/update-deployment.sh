aws cloudformation deploy \
  --template-file cloudformation.yml \
  --stack-name student-lms-pre-prod \
  --capabilities CAPABILITY_NAMED_IAM  --region=ap-south-1 \
  --s3-bucket=cdk-hnb659fds-assets-016530944324-ap-south-1 \
  --no-execute-changeset
