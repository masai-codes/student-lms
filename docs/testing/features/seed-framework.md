# Seed Framework

Area: layered test-data seeding (`seed/factories`, `seed/flows`, `seed/registry`, `seed/index.ts`, CLI, catalog generator)

## Commands

- List / run flows: `npm run seed`, `npm run seed login-and-join-lecture`
- Skip reset: `npm run seed login-and-join-lecture -- --no-reset`
- Regenerate catalog: `npm run seed:catalog`
- Run seed tests: `npm run test -- seed/`
- Optional DB integration (requires `DATABASE_URL` + `SEED_INTEGRATION=1`): `SEED_INTEGRATION=1 npm run test -- seed/flows/login-and-join-lecture.test.ts`

## Test cases

| ID | Case | Status |
|----|------|--------|
| SEED-TIME-001 | Relative time offsets and MySQL formatting | Covered |
| SEED-REG-001 | Registry lists and resolves known flows | Covered |
| SEED-REG-002 | Unknown flow id throws | Covered |
| SEED-CAT-001 | Catalog HTML generated from registry metadata | Covered |
| SEED-CAT-002 | Swagger-style accordion listing + Login buttons | Covered |
| SEED-CAT-003 | Login uses `/api/secret-login` with seeded userId | Covered |
| SEED-FLOW-001 | login-and-join-lecture composes factories and returns testUsers | Covered |
| SEED-RESET-001 | resetDatabase blocked in production | Covered |
| SEED-RESET-002 | resetDatabase excludes `_prisma_migrations` | Covered |
| SEED-INT-001 | Seeded lecture has active join button (integration) | Planned (opt-in via `SEED_INTEGRATION=1`) |

## Notes

- `resetDatabase()` truncates all app-data tables; use only on local/dev databases.
- Programmatic API: `import { seedFlow } from '../seed'`.
