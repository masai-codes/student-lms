aws cloudformation deploy \
  --template-file cloudformation.yml \
  --parameter-overrides \
  GoldenAMIId=ami-0c7f749c20b98bce8 \
  --stack-name student-lms-test \
  --capabilities CAPABILITY_NAMED_IAM  --region=ap-south-1 --no-execute-changeset
