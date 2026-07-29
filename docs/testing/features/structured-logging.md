# Structured logging

## Scope

- Utility: `src/lib/logger.ts`
- Tests: `src/lib/logger.test.ts`

## Behavior

- Server-side structured logs as one JSON object per line (compact in production, pretty-printed in non-production).
- `logger.debug` / `logger.info` → `console.log` (PM2 `app-out.log` → CloudWatch `{instance_id}/app-out`).
- `logger.warn` → `console.warn` (stderr → `app-error.log`).
- `logger.error` → `console.error` (stderr → `app-error.log`).
- `Error` values on `err` are serialized to `{ name, message, stack }`.

## Test cases

| ID | Case | Expected |
|----|------|----------|
| LOG-001 | `logger.info` in production | Single-line JSON on `console.log` with `level`, `time`, `msg`, and extra fields |
| LOG-002 | `logger.debug` in development | Pretty-printed JSON on `console.log` |
| LOG-003 | `logger.warn` / `logger.error` | Routed to `console.warn` / `console.error` |
| LOG-004 | `err` is an `Error` | Serialized error object in JSON payload |
| LOG-005 | `err` is a plain value | Passed through unchanged |
| LOG-006 | No `err` field | Payload has no `err` key |

## Usage

```typescript
import { logger } from '@/lib/logger'

logger.info({ msg: 'Points awarded', fn: 'awardManualPoints', userId, amount })
logger.error({ msg: 'Failed to award points', fn: 'awardManualPoints', err })
```

## Commands

- `npm run test -- src/lib/logger.test.ts`
- `npm run test`
