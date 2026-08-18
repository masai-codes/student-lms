# syntax=docker/dockerfile:1.7
#
# Production image for the Student LMS (TanStack Start + Nitro).
#
# TanStack Start's documented Node deployment path is: `vite build`, then
# `node .output/server/index.mjs`. The `nitro({ preset: 'node-server' })` plugin
# in vite.config.ts makes .output *standalone* — Nitro traces every runtime
# dependency into .output/server/node_modules — so the final stage copies only
# .output and never runs an install. That keeps the runtime image at ~40MB of
# app on top of the base, with none of the 1.1GB dev toolchain.
#
#   .output/server/index.mjs   HTTP server entrypoint (PORT / HOST env)
#   .output/public             client assets, served by the same Nitro server
#
# Build:
#   docker build -t student-lms:latest .
#
# Run:
#   docker run --rm -p 3000:3000 --env-file .env.local student-lms:latest
#
# See the "Deploying to ECS" notes at the bottom of this file.

ARG NODE_VERSION=24

# ---------------------------------------------------------------------------
# Stage 1 — dependencies
#
# Split from the build stage so editing source code does not re-run npm ci.
# Uses bookworm-slim (glibc) rather than alpine: the Vite/Tailwind/rolldown
# toolchain pulls in platform-specific native binaries, and glibc prebuilds are
# the ones that are always published.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app

# HUSKY=0        — the `prepare` script runs `husky`, which fails without .git
# PUPPETEER_*    — puppeteer is a devDependency used only by e2e tests; skip the
#                  ~150MB Chromium download
ENV HUSKY=0 \
    PUPPETEER_SKIP_DOWNLOAD=1

COPY package.json package-lock.json ./

# --include=dev: vite, the TanStack plugins and tailwind all live in
# devDependencies and are required to produce the build.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# ---------------------------------------------------------------------------
# Stage 2 — build
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Client-side config is *inlined into the bundle at build time* (Vite replaces
# every `import.meta.env.VITE_*` with a literal), so these come from the
# checked-in .env.production, which vite loads automatically for the production
# build. Note this differs from a local `npm run build`: .env.local is excluded
# from the build context on purpose, so your personal VITE_* overrides never
# leak into an image.
#
# `npm run build` already sets ENABLE_REDIS=false (no Redis needed to build) and
# --max_old_space_size=6144. The build genuinely needs that headroom: give the
# builder at least 8GB (Docker Desktop → Settings → Resources) or it OOMs.
RUN npm run build

# Sanity-check the contract the runtime stage depends on, so a bad build fails
# here rather than as a crash-looping ECS task.
RUN test -f .output/server/index.mjs && test -d .output/public

# ---------------------------------------------------------------------------
# Stage 3 — runtime
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# The `node` user (uid 1000) ships with the base image.
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

# /api/health is an existing route (src/routes/api/health.ts). ECS ignores an
# image HEALTHCHECK unless the task definition declares one, but this makes
# `docker run` / compose report container health correctly.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]

# ---------------------------------------------------------------------------
# Deploying to ECS — the bits that are not captured above
#
# * Architecture. Building on Apple Silicon produces an arm64 image. Either set
#   the task definition's runtimePlatform.cpuArchitecture to ARM64 (Fargate
#   Graviton — cheaper, and this output is pure JS so it runs unchanged), or
#   build amd64 in CI. `--platform linux/amd64` on a Mac works but runs the
#   6GB Vite build under QEMU emulation, which is painfully slow.
#
# * Runtime secrets. Use the task definition's `secrets` block (valueFrom a
#   Secrets Manager ARN, optionally with a `:jsonKey::` suffix to pull one key
#   out of a JSON blob secret) — see cloudformation-ecs.yml. ECS injects these
#   into the container's env before the app starts, via the execution role, so
#   no secret-fetching code runs in the app at all.
#
# * Load balancer. Nitro expects to sit behind a proxy terminating TLS. Point
#   the target group at port 3000 with health check path /api/health.
#
# * Signals. Nitro registers its own SIGTERM handler, so node-as-PID-1 shuts
#   down gracefully; set initProcessEnabled: true in the task definition if you
#   also want zombie reaping. Give ECS a stopTimeout (~30s) so in-flight
#   requests drain, matching the 15s kill_timeout the PM2 deploy used.
#
# * Static assets. Nitro serves .output/public itself, so this image is
#   self-sufficient. The existing buildspec.yml also syncs
#   .output/public/assets to S3 behind CloudFront — keep doing that if you want
#   CDN-served, immutable-cached assets, but it is no longer required.
#
# * Migrations. scripts/migrate.mjs needs drizzle-kit and the full node_modules,
#   which this image deliberately does not carry. Run migrations as a separate
#   step (CodeBuild, or a one-off task from a dedicated tooling image) rather
#   than on container start, so N scaled-out tasks do not race each other.
# ---------------------------------------------------------------------------
