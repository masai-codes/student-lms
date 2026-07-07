# Spec: CI/CD scripts for feature-branch deployments

## Context (already done, do not redo)

- Application is Dockerized. Image builds a single container exposing one
configurable port via the `PORT` env var. DB connection is entirely
env-var driven (`DATABASE_URL`).
- Route53 has a wildcard record `*.demo.example.com` → the existing ALB.
- ACM has a wildcard cert `*.demo.example.com` attached to the ALB's HTTPS
listener.
- MySQL runs once, directly on the EC2 host (or as a single long-lived
container) — NOT one MySQL instance per branch. Each feature branch gets
its own **logical database** on that shared instance.
- App containers run with `--network=host` on the EC2 host, so they can
reach MySQL via `DB_HOST=127.0.0.1`. With host networking, `PORT` is the
actual port bound on the host — this is also the port registered with
the ALB target group.



## What needs to be built

Two scripts (or two CI jobs, your call — described as scripts below since
that's what a coding agent should produce), plus a small scheduled cleanup
job.

1. `create-feature-env.sh` — provisions everything for a feature branch.
2. `teardown-feature-env.sh` — tears down everything for a feature branch,
  exact reverse of creation.
3. `cleanup-orphans.sh` — scheduled job, catches anything creation/teardown
  missed.

All three should be idempotent: safe to re-run without erroring if some or
all resources already exist / are already gone.

---



## Inputs / environment variables every script needs


| Variable                              | Example                                                           | Notes                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BRANCH`                              | `feature-login-flow`                                              | Sanitize to a safe identifier: lowercase, replace anything not `[a-z0-9-]` with `-`, truncate to a safe length (MySQL DB names and ALB rule/target-group names have length limits — 63 chars is a safe ceiling). Compute this once and reuse everywhere so the sanitized name is consistent across DB, container, ALB. |
| `EC2_HOST`                            | internal IP/SSM target of the EC2 instance running app containers | However CI reaches the box — SSH key or SSM.                                                                                                                                                                                                                                                                           |
| `MYSQL_ADMIN_*`                       | host/user/pass with `CREATE`/`DROP DATABASE` privileges           | Used only by these scripts, not by the app itself.                                                                                                                                                                                                                                                                     |
| `APP_DB_USER` / `APP_DB_PASS`         | credentials the *app* uses at runtime                             | Should already exist with access scoped appropriately; if per-branch DB users are desired that's a decision to flag back to me, default assumption is one shared app DB user with access to all `demo_`* schemas.                                                                                                      |
| `ALB_LISTENER_ARN`                    | ARN of the HTTPS listener                                         | Fixed, from existing infra.                                                                                                                                                                                                                                                                                            |
| `ECR_REPO` / image tag strategy       | e.g. `app:$BRANCH`                                                | However images are pushed/pulled today.                                                                                                                                                                                                                                                                                |
| `PORT_RANGE_START` / `PORT_RANGE_END` | e.g. `8080` / `8199`                                              | Range reserved for branch containers on the host.                                                                                                                                                                                                                                                                      |


**Deterministic port assignment**: derive the port from a hash of the
sanitized branch name, mapped into the reserved range, e.g.
`port = PORT_RANGE_START + (hash(branch) % (PORT_RANGE_END - PORT_RANGE_START))`.
Must be the same function in both create and teardown so teardown can find
the right container without needing external state. Handle the (rare)
collision case: if the computed port is already in use by a *different*
branch's container, either widen the range or maintain a simple lock/lookup
(a file or table mapping branch → port) — flag this decision back to me if
the hash approach feels fragile.

---



## `create-feature-env.sh`

Triggered on: PR opened, PR synchronize (new commits pushed).

Steps, in order:

1. **Sanitize branch name** into `$SAFE_BRANCH` as described above.
2. **Compute deterministic port** `$PORT` for this branch.
3. **Build and push image**: `docker build -t $ECR_REPO:$SAFE_BRANCH .` then
  push. (Skip rebuild if this step already exists elsewhere in your
   pipeline — just confirm the tag naming convention matches what teardown
   expects.)
4. **Database**:
  - `CREATE DATABASE IF NOT EXISTS demo_$SAFE_BRANCH` — idempotent, safe to
   re-run on every push to the same PR.
  - **Only on first creation** (i.e. only if the database was just
  created, not on subsequent pushes to the same PR): apply all
  migrations currently on `main` against `demo_$SAFE_BRANCH`, then run
  the seed script. Do NOT re-apply migrations/seed on every push — that
  would wipe the developer's in-progress `drizzle push` state. Detect
  "first creation" by checking whether the schema was empty before step
  4's `CREATE DATABASE` ran (e.g. query `information_schema.tables` for
  that schema name before creating it).
5. **Container**:
  - If a container named `app_$SAFE_BRANCH` already exists (re-push case),
   stop and remove it first.
  - Run the new image:
    ```
    docker run -d \
      --name app_$SAFE_BRANCH \
      --network=host \
      --memory=512m --cpus=1 \
      -e PORT=$PORT \
      -e DATABASE_URL=mysql://root@host.docker.internal \
      -e DB_PORT=3306 \
      -e DB_NAME=demo_$SAFE_BRANCH \
      --label branch=$SAFE_BRANCH \
      --restart unless-stopped \
      $ECR_REPO:$SAFE_BRANCH
    ```
  - Wait for the app to respond on `$PORT` (simple retry loop against a
  health endpoint) before moving on — don't register an unhealthy
  target with the ALB.
6. **ALB**:
  - If a target group named e.g. `tg-$SAFE_BRANCH` doesn't exist, create
   one (`aws elbv2 create-target-group`, target type `instance`, health
   check path configured).
  - Register the EC2 instance on `$PORT` with that target group
  (`aws elbv2 register-targets`).
  - If a listener rule for host-header `$SAFE_BRANCH.demo.example.com`
  doesn't exist, create one on `$ALB_LISTENER_ARN` forwarding to the
  target group. If it already exists (re-push case), leave it — target
  group/registration is what changed, not the rule.
7. **Notify**: output/echo the preview URL
  `https://$SAFE_BRANCH.demo.example.com` so CI can post it as a PR
   comment (however your pipeline currently posts PR comments — reuse that,
   don't build a new mechanism).

Tag everything created (container label, target group tags) with
`branch=$SAFE_BRANCH` and something like `managed-by=feature-env-ci` — this
tag is what `cleanup-orphans.sh` will rely on.

---



## `teardown-feature-env.sh`

Triggered on: PR closed (covers both merged and manually closed — use the
same trigger for both, teardown logic doesn't care which).

Steps, in order (exact reverse of creation), each wrapped so a failure in
one step doesn't block the rest — log and continue rather than aborting
the whole teardown on the first error:

1. **Sanitize branch name** into `$SAFE_BRANCH` (same function as creation).
2. **ALB**: delete the listener rule for `$SAFE_BRANCH.demo.example.com`
  (find it by tag/host-header match, don't hardcode a rule ARN). Delete
   the target group `tg-$SAFE_BRANCH`.
3. **Container**: `docker stop app_$SAFE_BRANCH && docker rm app_$SAFE_BRANCH`.
  No-op cleanly if it's already gone.
4. **Database**: `DROP DATABASE IF EXISTS demo_$SAFE_BRANCH`.
5. **Image** (optional): remove the `$ECR_REPO:$SAFE_BRANCH` tag/image if
  you don't want branch-tagged images accumulating in the registry
   indefinitely. Flag this back to me if you'd rather handle image
   lifecycle separately via an ECR lifecycle policy instead of per-branch
   deletion — that's usually the lower-maintenance choice.

---



## `cleanup-orphans.sh`

Triggered on: a schedule (e.g. daily cron / EventBridge rule), independent
of any single PR event. Purpose: catch anything left behind by a failed or
skipped teardown (workflow didn't run, job errored partway, branch force-
deleted without closing the PR through GitHub, etc).

Steps:

1. Get the list of currently **open** PR branch names from the repo (via
  GitHub API).
2. Get the list of currently running resources tagged `managed-by=feature-
  env-ci`:
  - Containers on the EC2 host with the `branch=` label.
  - ALB target groups / listener rules with the `branch=` tag.
  - Databases matching `demo_%` naming pattern (list schemas, filter by
  prefix).
3. For any resource whose `branch` value is NOT in the open-PR list, treat
  it as orphaned and run the same deletion steps as
   `teardown-feature-env.sh` for that branch.
4. Log what was cleaned up (branch name, resource type) so there's a
  record — don't silently delete.

---



## Non-negotiable safety properties

- **Idempotency**: every script must be safe to re-run. Re-running
creation on an existing branch should not wipe developer data. Re-
running teardown on an already-torn-down branch should not error.
- **No cross-branch blast radius**: every AWS/DB/container operation must
be scoped by `$SAFE_BRANCH` — no operation should ever be able to affect
a resource belonging to a different branch. Review each script for any
place a bad sanitize or wildcard match could widen scope.
- **Fail loud on ambiguity**: if branch sanitization would produce a
collision with an existing different branch's resources (e.g. two raw
branch names sanitize to the same string), fail the job with a clear
error rather than silently reusing/overwriting the other branch's
environment.
- **Least privilege**: the CI role/credentials used should only have the
specific AWS/MySQL permissions these scripts need (ALB rule/target-group
CRUD, EC2 SSM/SSH to the one instance, CREATE/DROP DATABASE) — not broad
admin access.



## Deliverables expected back

- `create-feature-env.sh`
- `teardown-feature-env.sh`
- `cleanup-orphans.sh`
- The CI workflow file(s) wiring these to the relevant GitHub events /
schedule
- A short README section documenting the required env vars/secrets and how
to run each script manually for debugging

