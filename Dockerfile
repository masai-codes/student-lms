# --- Build stage ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Align npm with the lockfile format used locally (npm 11); skip git hooks in CI/image builds.
ENV HUSKY=0
RUN npm install -g npm@11 --fetch-retries=5 --fetch-retry-mintimeout=20000 && npm ci

COPY . .
# TanStack Start + Nitro production build (outputs to .output/)
ENV NODE_OPTIONS=--max_old_space_size=6144
RUN npm run build

# --- Runtime stage ---
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Nitro bundles server code and traced dependencies into .output/.
# No secrets or DATABASE_URL are baked in — inject everything at runtime.
#
# Database host addressing (the DB runs OUTSIDE this container):
#   Mac / Windows (Docker Desktop): host.docker.internal works by default.
#   Linux: add --add-host=host.docker.internal:host-gateway to docker run,
#          or use extra_hosts in docker-compose.yml.
#   Do NOT use localhost in DATABASE_URL — inside the container that refers
#   to the container itself, not the host machine where MySQL is listening.
#
# Examples:
#   Local MySQL on host (published port 3306):
#     DATABASE_URL=mysql://root:root@host.docker.internal:3306/lms_dev_db
#   Remote RDS:
#     DATABASE_URL=mysql://user:pass@<rds-endpoint>:3306/lms_dev_db

ENV PORT=3000

COPY --from=builder /app/.output ./.output

USER appuser
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
