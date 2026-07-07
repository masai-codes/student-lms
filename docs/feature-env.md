# Feature Preview Environment (PR Branches)

The repo includes CI-friendly scripts to provision and teardown per-branch preview
environments on a shared EC2 host + shared MySQL server:

- `scripts/feature-env/create-feature-env.sh`
- `scripts/feature-env/teardown-feature-env.sh`
- `scripts/feature-env/cleanup-orphans.sh`

## Required env vars/secrets

- Branch and naming: `BRANCH`, `BASE_DOMAIN` (for example `demo.example.com`)
- Image/runtime: `ECR_REPO`, `PORT_RANGE_START`, `PORT_RANGE_END`
- MySQL admin (provisioning only): `MYSQL_ADMIN_USER`, `MYSQL_ADMIN_PASS`,
  optional `MYSQL_ADMIN_HOST` (default `127.0.0.1`) and `MYSQL_ADMIN_PORT`
  (default `3306`)
- App DB runtime creds: `APP_DB_USER`, `APP_DB_PASS`, optional `APP_DB_HOST`,
  optional `APP_DB_PORT`
- ALB and EC2: `ALB_LISTENER_ARN`, `VPC_ID`, `EC2_INSTANCE_ID`
- Optional initialization hooks (first create only): `MIGRATION_CMD`, `SEED_CMD`
- Optional behavior: `PORT_MAP_FILE`, `BRANCH_MAP_FILE`, `HEALTHCHECK_PATH`,
  `DRY_RUN=1`

## Manual debugging commands

Create/update environment:

```bash
BRANCH=feature-login-flow \
BASE_DOMAIN=demo.example.com \
ECR_REPO=123456789012.dkr.ecr.ap-south-1.amazonaws.com/student-lms \
PORT_RANGE_START=8080 PORT_RANGE_END=8199 \
APP_DB_USER=app APP_DB_PASS=secret \
MYSQL_ADMIN_USER=root MYSQL_ADMIN_PASS=secret \
ALB_LISTENER_ARN=arn:aws:elasticloadbalancing:... \
VPC_ID=vpc-xxxx EC2_INSTANCE_ID=i-xxxx \
bash scripts/feature-env/create-feature-env.sh
```

Teardown environment:

```bash
BRANCH=feature-login-flow \
BASE_DOMAIN=demo.example.com \
ALB_LISTENER_ARN=arn:aws:elasticloadbalancing:... \
MYSQL_ADMIN_USER=root MYSQL_ADMIN_PASS=secret \
ECR_REPO=student-lms \
bash scripts/feature-env/teardown-feature-env.sh
```

Cleanup orphaned branches:

```bash
GITHUB_REPOSITORY=owner/repo \
GITHUB_TOKEN=ghp_xxx \
BASE_DOMAIN=demo.example.com \
ALB_LISTENER_ARN=arn:aws:elasticloadbalancing:... \
MYSQL_ADMIN_USER=root MYSQL_ADMIN_PASS=secret \
bash scripts/feature-env/cleanup-orphans.sh
```

## Idempotency and safety behavior

- Re-running create for the same branch replaces the container but does not
  re-seed existing branch DB schemas.
- Re-running teardown is safe; missing resources are treated as no-op.
- Port allocation is deterministic with a persisted branch-to-port map to avoid
  cross-branch collisions.
- Orphan cleanup only tears down resources for branches that are not in the open
  PR list.
