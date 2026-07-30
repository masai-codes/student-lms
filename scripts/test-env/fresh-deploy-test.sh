aws cloudformation deploy --stack-name student-lms-test --template-file cloudformation.yml --capabilities CAPABILITY_NAMED_IAM\
  --parameter-overrides \
  GoldenAMIId=ami-0b09e3401aa5d2b47 \
  RDSInstanceIdentifier=lms-dev-db \
  SecretsManagerARN=arn:aws:secretsmanager:ap-south-1:302263069732:secret:demo/student-lms-3R4cN1 \
  ACMCertificateARNRegional=arn:aws:acm:ap-south-1:302263069732:certificate/4aeba585-9e33-463a-888e-ee12b602ffc5 \
  ACMCertificateARNCloudFront=arn:aws:acm:us-east-1:302263069732:certificate/acdb202a-b40d-477b-887b-5dfcf363d344 \
  HostedZoneId=Z03616809C8IF5NBDP6D \
  DomainName=learn.iasam.dev \
  GitHubConnection=arn:aws:codeconnections:ap-south-1:302263069732:connection/6edd95aa-0186-42c9-b8d6-38d1dd7cdaf3 \
  GitHubBranch=cloudformation \
  SNSTopicARN=arn:aws:sns:ap-south-1:302263069732:student-lms-alerts \
  --region=ap-south-1 \
  --s3-bucket=cdk-hnb659fds-assets-302263069732-ap-south-1
