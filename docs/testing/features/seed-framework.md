# Seed Framework

Area: layered test-data seeding (`seed/factories`, `seed/flows`, `seed/registry`, `seed/index.ts`, CLI, catalog generator)

## Commands

- List / run flows: `npm run seed`, `npm run seed login-and-join-lecture`, `npm run seed onboarding-welcome-modal`
- Skip reset (compose flows): `npm run seed onboarding-fees-unpaid -- --no-reset`
- Regenerate catalog: `npm run seed:catalog`
- Run seed tests: `npm run test -- seed/`
- Optional DB integration (requires `DATABASE_URL` + `SEED_INTEGRATION=1`): `SEED_INTEGRATION=1 npm run test -- seed/flows/onboarding.integration.test.ts`

## Test cases

| ID                 | Case                                                            | Status                                    |
| ------------------ | --------------------------------------------------------------- | ----------------------------------------- |
| SEED-TIME-001      | Relative time offsets and MySQL formatting                      | Covered                                   |
| SEED-REG-001       | Registry lists and resolves known flows                         | Covered                                   |
| SEED-REG-002       | Unknown flow id throws                                          | Covered                                   |
| SEED-CAT-001       | Catalog HTML generated from registry metadata                   | Covered                                   |
| SEED-CAT-002       | Swagger-style accordion listing + Login buttons                 | Covered                                   |
| SEED-CAT-003       | Login uses `/api/secret-login` with seeded userId               | Covered                                   |
| SEED-FLOW-001      | login-and-join-lecture composes factories and returns testUsers | Covered                                   |
| SEED-FLOW-002      | Onboarding shared builder wires scenario presets                | Covered                                   |
| SEED-FLOW-003      | Onboarding constants map section names to video URLs            | Covered                                   |
| SEED-RESET-001     | resetDatabase blocked in production                             | Covered                                   |
| SEED-RESET-002     | resetDatabase excludes `_prisma_migrations`                     | Covered                                   |
| SEED-SAFETY-001    | Seed entrypoints require `DATABASE_URL` contains `localhost`    | Covered                                   |
| SEED-SAFETY-002    | resetDatabase requires `DATABASE_URL` contains `localhost`      | Covered                                   |
| SEED-ISOLATION-001 | Two onboarding flows coexist with distinct user/batch ids       | Planned (opt-in via `SEED_INTEGRATION=1`) |
| SEED-INT-001       | Seeded lecture has active join button (integration)             | Planned (opt-in via `SEED_INTEGRATION=1`) |
| SEED-INT-002       | onboarding-fees-paid exposes program onboarding lectures        | Planned (opt-in via `SEED_INTEGRATION=1`) |

## Notes

- `resetDatabase()` truncates all app-data tables; use only on local/dev databases.
- Seeding now hard-fails unless `DATABASE_URL` includes `localhost`.
- Programmatic API: `import { seedFlow } from '../seed'`.
- Every flow creates isolated seed data (flow-scoped emails and batch names) so multiple flows can coexist after `--no-reset`.
- `onboarding-fees-unpaid` is the interactive LMS Walkthrough test bed: videos + auto-next + profile photo + download-app all start unticked (welcome dismissed, program tab locked).
