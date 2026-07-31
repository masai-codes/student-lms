# Dashboard overview-app Test Cases

## Scope

Slim mobile-app overview endpoint `GET /api/dashboard/overview-app` that returns
only `pendingTasks`, `batchTransferPaymentBanners`, and `batchStartBanners` by
composing the existing focused services (no new business logic).

## Test Files

- `src/server/api/dashboard/__tests__/getDashboardOverviewApp.service.test.ts`
- `src/server/api/dashboard/handlers/__tests__/getDashboardOverviewApp.handler.test.ts`

## How To Run

```bash
npm run test -- src/server/api/dashboard/__tests__/getDashboardOverviewApp.service.test.ts src/server/api/dashboard/handlers/__tests__/getDashboardOverviewApp.handler.test.ts
```

## Covered Test Cases

- `OVAPP-001` - Module: `getDashboardOverviewApp` (service) - Case: composes the three sub-services in parallel and returns `{ pendingTasks, batchTransferPaymentBanners, batchStartBanners }` with the same `userId` / `now` passed through - Status: Covered
- `OVAPP-002` - Module: `getDashboardOverviewApp` (service) - Case: empty sub-service results yield empty arrays (never null/omitted) - Status: Covered
- `OVAPP-003` - Module: `handleGetDashboardOverviewApp` - Case: authenticated session returns the service payload as `200` JSON - Status: Covered
- `OVAPP-004` - Module: `handleGetDashboardOverviewApp` - Case: unauthenticated session returns `401` - Status: Covered
- `OVAPP-005` - Module: `handleGetDashboardOverviewApp` - Case: unexpected service throw maps to `500` with `SERVER_ERROR_FETCHING_DASHBOARD_OVERVIEW_APP` - Status: Covered

## App implementation doc

See `docs/app/overview-app.md` for the app-team data-type contract.
