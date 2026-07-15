# AGENTS.md — Developer & Agent Reference

This file is the single-source-of-truth for anyone (human or AI agent) building a
new feature in `student-lms-experience`. Read it before touching any code.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 22 |
| Framework | TanStack Start (full-stack React) + TanStack Router (file-based) |
| Bundler | Vite 7 |
| Server runtime | Nitro (`node-server` preset) |
| UI | React 19, Tailwind CSS 4, shadcn/ui + Radix primitives |
| Icons | `@phosphor-icons/react` (primary), `lucide-react` (via shadcn) |
| Data fetching | TanStack Query v5 (client), `fetchJson` helper (isomorphic fetch) |
| Database | MySQL via `mysql2` + Drizzle ORM |
| Validation | Zod |
| AI | Vercel AI SDK + Anthropic |
| Storage | AWS S3 |
| Testing | Vitest + Testing Library |
| Deploy | `vite build` → `.output/server/`, PM2 |

---

## Directory map

```
src/
├── routes/                    # All pages and API endpoints (file-based)
│   ├── api/                   # REST JSON endpoints (new work lives here)
│   ├── (auth)/                # Sign-in, password reset, v2 auth handlers
│   └── (protected)/           # Logged-in app pages (dashboard, courses, etc.)
│
├── server/
│   └── api/                   # Backend logic for REST endpoints (NEW pattern)
│       ├── http/              # Shared HTTP utilities (auth, errors, responses)
│       └── <feature>/
│           ├── handlers/      # HTTP layer: auth check, parse request, map errors
│           └── services/      # Business logic, Drizzle queries
│
├── lib/
│   └── api/                   # Typed client-side API callers
│       ├── fetchJson.ts       # Core isomorphic fetch helper
│       ├── <feature>Paths.ts  # URL constant objects
│       └── <feature>/         # Per-feature API caller modules
│
├── query/                     # TanStack Query option factories (queryKey, queryFn, staleTime)
│
├── components/
│   ├── ui/                    # shadcn/Radix primitives — do not modify
│   ├── features/              # Feature screens and logic
│   └── common/ navbar/ etc.  # Shared layout pieces
│
├── db/
│   ├── index.ts               # Drizzle connection (pooled MySQL)
│   └── schema.ts              # Full table schema (Drizzle, originally Prisma-generated)
│
├── utils/                     # Cross-cutting helpers
├── hooks/                     # Reusable React hooks
├── types/index.ts             # Shared TypeScript types (User, RouterContext, etc.)
├── constants/                 # App-wide constants
└── globalSettings.ts          # Pagination sizes, shared literals
```

---

## The only pattern for new features: REST API

Every new feature follows this strict five-layer pipeline:

```
src/routes/api/<feature>/<action>.ts          ← HTTP entry (1 line, delegates)
src/server/api/<feature>/handlers/<x>.handler.ts  ← HTTP layer (auth + response shape)
src/server/api/<feature>/services/<x>.service.ts  ← Business logic + Drizzle queries
src/lib/api/<feature>/<feature>Paths.ts       ← URL constants
src/lib/api/<feature>/<feature>Api.ts         ← Typed client callers (fetchJson)
src/query/<feature>/<x>Query.ts              ← TanStack Query options factory
src/components/features/<feature>/            ← React UI
src/routes/(protected)/_layout/<path>.tsx     ← Page route (thin, imports component)
```

### Step 1 — Route file (HTTP entry point)

`src/routes/api/<feature>/<action>.ts`

Route files must stay thin. All they do is declare the HTTP method and delegate to
a handler. No logic, no Drizzle, no auth here.

```ts
import { createFileRoute } from '@tanstack/react-router'
import { handleGetFoo } from '@/server/api/foo/handlers/getFoo.handler'

export const Route = createFileRoute('/api/foo')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetFoo(request),
    },
  },
})
```

For POST endpoints pass the request the same way:

```ts
POST: ({ request }) => handleCreateFoo(request),
```

### Step 2 — Handler (HTTP layer only)

`src/server/api/<feature>/handlers/<action>.handler.ts`

Handlers own three things: session auth, request parsing, and error-to-response
mapping. They must **not** contain business logic or Drizzle queries.

```ts
import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getFoo } from '@/server/api/foo/services/getFoo.service'

export async function handleGetFoo(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    // For POST: const body = await request.json() as { ... }
    const data = await getFoo(userId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to get foo', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_FOO'))
    }
    return mapThrownErrorToResponse(error)
  }
}
```

**HTTP utilities** — always use these, never create raw `Response` objects:

| Utility | Location | Purpose |
|---|---|---|
| `requireSessionUserId(request)` | `server/api/http/requireSessionUser` | Returns `userId` or throws 401 |
| `jsonOk(data)` | `server/api/http/responses` | `200 application/json` response |
| `jsonError(status, code, msg?)` | `server/api/http/responses` | Error JSON response |
| `mapThrownErrorToResponse(err)` | `server/api/http/responses` | Maps `ApiError` or known `Error` messages to responses |
| `ApiError` | `server/api/http/apiError` | Throw for known error cases (400, 403, 404, etc.) |
| `isApiError(err)` | `server/api/http/apiError` | Type guard for the above |
| `experienceApiFetch(path, init?)` | `server/api/http/experienceApiFetch` | Proxy calls to the upstream Experience API, forwarding session cookies |

### Step 3 — Service (business logic)

`src/server/api/<feature>/services/<action>.service.ts`

Services own all business rules and database access. They must **not** import
anything from TanStack Router/Start, return `Response` objects, or touch HTTP
concepts.

```ts
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { foos } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'

export interface FooResult {
  id: number
  title: string
}

export async function getFoo(userId: number): Promise<FooResult> {
  const rows = await db
    .select({ id: foos.id, title: foos.title })
    .from(foos)
    .where(eq(foos.userId, userId))
    .limit(1)

  const row = rows.at(0)
  if (!row) throw new ApiError(404, 'FOO_NOT_FOUND')
  return row
}
```

Use the Drizzle query builder (`db.select`, `db.insert`, `db.update`, `db.delete`).
Avoid raw `sql` template queries unless the query genuinely cannot be expressed
with the builder.

### Step 4 — URL constants

`src/lib/api/<feature>/<feature>Paths.ts`

All API paths live in one `const` object. Never hard-code `/api/...` strings in
components or query files.

```ts
export const FOO_API = {
  list:   '/api/foo',
  detail: (id: number) => `/api/foo/${id}`,
  create: '/api/foo/create',
} as const
```

### Step 5 — Client API caller

`src/lib/api/<feature>/<feature>Api.ts`

Import the paths object and call `fetchJson`. Type the return value using the
service's exported interface (type-only import keeps server code out of the
client bundle).

```ts
import type { FooResult } from '@/server/api/foo/services/getFoo.service'
import { fetchJson } from '@/lib/api/fetchJson'
import { FOO_API } from '@/lib/api/foo/fooPaths'

export async function fetchFoo(): Promise<FooResult> {
  return fetchJson<FooResult>(FOO_API.list)
}

export async function createFoo(body: { title: string }): Promise<FooResult> {
  return fetchJson<FooResult>(FOO_API.create, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
```

`fetchJson` is isomorphic — it uses relative URLs in the browser and absolute
URLs on the server (forwarding the session cookie automatically). Never call
`fetch` directly in feature code; always go through `fetchJson`.

### Step 6 — TanStack Query options

`src/query/<feature>/<x>Query.ts`

Export a factory function (not a bare object) so React Query can be called
consistently.

```ts
import { fetchFoo } from '@/lib/api/foo/fooApi'

export const FOO_QUERY_KEY = ['foo'] as const

export const fooQuery = () => ({
  queryKey: FOO_QUERY_KEY,
  queryFn: fetchFoo,
  staleTime: 5 * 60 * 1000,
})
```

For screens where data must be fresh on every navigation, spread
`MASAIVERSE_V2_REFETCH_ON_NAV` from `@/query/masaiverse-v2/queryDefaults` or
set `refetchOnMount: 'always'` explicitly.

### Step 7 — Component

`src/components/features/<feature>/`

Components consume the query and render UI. They must not call `fetch` directly
or import server-only code. Use `useQuery` for reads, `useMutation` or direct
`fetchJson` calls for writes.

```tsx
import { useQuery } from '@tanstack/react-query'
import { fooQuery } from '@/query/foo/fooQuery'

export default function FooPage() {
  const { data, isPending } = useQuery(fooQuery())
  if (isPending) return <Skeleton />
  return <div>{data?.title}</div>
}
```

### Step 8 — Page route

`src/routes/(protected)/_layout/<path>.tsx`

Page routes are thin. All they do is import the feature component and (when
needed) supply a `beforeLoad` guard. Loaders that call Drizzle directly are the
old pattern; do not add new ones.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import FooPage from '@/components/features/foo/FooPage'

export const Route = createFileRoute('/(protected)/_layout/foo')({
  component: FooPage,
})
```

---

## Error handling contract

| Situation | What to throw / return |
|---|---|
| Unauthenticated | `requireSessionUserId` throws automatically (401) |
| Bad input | `throw new ApiError(400, 'INVALID_FIELD_NAME')` |
| Not found | `throw new ApiError(404, 'FOO_NOT_FOUND')` |
| Unexpected server error | `catch` in handler → `mapThrownErrorToResponse(new Error('SERVER_ERROR_...'))` |
| Client receives non-2xx | `fetchJson` throws `ApiClientError` with `.status` and `.code` |

Add new error string cases to `mapThrownErrorToResponse` in
`src/server/api/http/responses.ts` when the client needs to distinguish them.

---

## Database access

- Import `db` from `@/db` and table symbols from `@/db/schema`.
- Use Drizzle builder methods: `db.select()`, `db.insert()`, `db.update()`, `db.delete()`.
- The connection is a pooled `mysql2` pool (limit 10). Do not open additional
  connections.

```ts
import { db } from '@/db'
import { foos } from '@/db/schema'
import { eq } from 'drizzle-orm'

const rows = await db.select().from(foos).where(eq(foos.id, id))
```

---

## Auth & session

- Every protected API route must call `requireSessionUserId(request)` at the top
  of its handler before doing anything else.
- Session identity is stored in a cookie and resolved via
  `getCurrentSessionUserId` (called internally by `requireSessionUserId`).
- Page routes get the current user through the `/(protected)/_layout` route
  `beforeLoad`, which runs `fetchCurrentUser()` (a `createServerFn` — existing
  pattern kept for the layout guard only) and stores the result in router
  context. Access it with `Route.useRouteContext()` → `context.user`.

---

## UI conventions

- Use `shadcn/ui` components from `src/components/ui/` for all standard controls
  (Button, Input, Dialog, Tabs, etc.). These wrap Radix primitives.
- Prefer `@phosphor-icons/react` for icons.
- Tailwind CSS 4 for all styling. Follow conventions in the same feature area.
- Keep components focused and readable. Max file length is 200 lines; extract
  sub-components, hooks, or utils when approaching this limit.
- Handle all edge cases: empty states, loading skeletons, null/undefined values,
  and error states.

---

## Testing requirements

- Add or update tests for every non-trivial behavior change.
- Use Vitest. Colocate test files: `foo.ts` → `foo.test.ts`.
- Prefer Testing Library for component tests (behavior-driven, not
  implementation details).
- Cover: positive path, fallback/edge cases, critical UI state transitions.
- Coverage target is 100% for any touched module.
- Update `docs/testing/feature-test-matrix.md` for every touched feature.
- Add or update `docs/testing/features/<feature>.md` when tests change.
- Complete `docs/testing/pr-checklist.md` for every PR that changes feature
  behavior or test setup.

Run tests:

```bash
npm run test
```

---

## Development commands

```bash
npm run dev        # Vite dev server on port 3002 (hot reload)
npm run build      # Production build → .output/
npm run start      # Run production build (node .output/server/index.mjs)
npm run test       # Vitest unit/component tests
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (no emit, type errors only)
npm run check      # Prettier + ESLint fix (formats and lints in one pass)
```

Both `npm run test` and `npm run lint` must pass before any PR is merged.

---

## Adding a new feature — checklist

```
[ ] src/routes/api/<feature>/<action>.ts           — route file, HTTP entry
[ ] src/server/api/<feature>/handlers/<x>.handler.ts — HTTP layer
[ ] src/server/api/<feature>/services/<x>.service.ts — business logic
[ ] src/lib/api/<feature>/<feature>Paths.ts         — URL constants
[ ] src/lib/api/<feature>/<feature>Api.ts           — fetchJson callers
[ ] src/query/<feature>/<x>Query.ts                 — React Query options
[ ] src/components/features/<feature>/              — UI components
[ ] src/routes/(protected)/_layout/<path>.tsx       — page route
[ ] *.test.ts(x) colocated with each file           — tests
[ ] docs/testing/features/<feature>.md              — test docs
[ ] docs/testing/feature-test-matrix.md             — matrix updated
```

---

## What NOT to do

- **Do not** add new `createServerFn` calls. The old
  `src/server/<domain>/fetch*.ts` files use this pattern; it is not used for
  new work. All new backend logic goes through `src/routes/api/` → handler →
  service.
- **Do not** call `fetch` directly in components or query files. Use `fetchJson`.
- **Do not** put business logic in handler files or HTTP logic in service files.
- **Do not** import server-only modules (Drizzle, `@/db`, `@/server/...`) into
  components or `lib/api` files. Use type-only imports where you need the type.
- **Do not** hard-code `/api/...` URL strings. Always define them in a `*Paths.ts`
  constants file and import from there.
- **Do not** create raw `Response` objects. Use `jsonOk`, `jsonError`, or
  `mapThrownErrorToResponse` from `@/server/api/http/responses`.
- **Do not** exceed 200 lines per file.
- **Do not** write raw SQL via `sql\`...\`` unless the Drizzle builder cannot
  express the query.
