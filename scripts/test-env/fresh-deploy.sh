aws cloudformation deploy --stack-name student-lms-production --template-file cloudformation.yml --capabilities CAPABILITY_NAMED_IAM\
  --parameter-overrides \
  GoldenAMIId=ami-0cc3eda6d8364df96 \
  RDSInstanceIdentifier=judge0-db \
  SecretsManagerARN=arn:aws:secretsmanager:ap-south-1:302263069732:secret:demo/student-lms-3R4cN1 \
  ACMCertificateARNRegional=arn:aws:acm:ap-south-1:302263069732:certificate/4aeba585-9e33-463a-888e-ee12b602ffc5 \
  ACMCertificateARNCloudFront=arn:aws:acm:us-east-1:302263069732:certificate/acdb202a-b40d-477b-887b-5dfcf363d344 \
  HostedZoneId=Z03616809C8IF5NBDP6D \
  DomainName=learn.iasam.dev \
  GitHubBranch=cloudformation \
  --region=ap-south-1 \
  --s3-bucket=cdk-hnb659fds-assets-302263069732-ap-south-1 \
  --no-execute-changeset 
