# API docs (Swagger / OpenAPI inventory)

## Scope

Non-production Swagger UI backed by an auto-inventoried OpenAPI 3 document:

- `GET /api/docs` — Swagger UI (CDN)
- `GET /api/docs/openapi.json` — OpenAPI JSON built by scanning `src/routes/api/**`

Both return **404** when `NODE_ENV=production`.

## Implementation

- Gate: `src/server/api/docs/isApiDocsEnabled.ts`
- Scanner: `src/server/api/docs/scanApiRoutes.ts`
- Builder: `src/server/api/docs/buildOpenApiDocument.ts`
- Handlers: `src/server/api/docs/handlers/*`

Auto-inventory covers path + HTTP methods, plus query params and JSON body
fields mined from handlers (and one hop of `@/` imports such as parse helpers /
Zod schemas). Request/response response shapes are still not fully typed.

## Commands

```bash
npm run test -- src/server/api/docs
```
