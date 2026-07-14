# Datetime & Timezone Handling — Full Flow

This document explains, end to end, how `student-lms` stores, reads, converts, and
displays datetimes — and how user/viewer timezones are handled. It is the single
reference for anyone touching a time column, writing a query, or rendering a
timestamp in the UI.

---

## 1. The core problem

Two MySQL column types look **byte-for-byte identical** when you `SELECT` them, but
they denote different absolute instants:

| Column type | Stores             | `"2026-07-09 03:20:00"` means |
| ----------- | ------------------ | ----------------------------- |
| `DATETIME`  | **IST wall-clock** | 03:20 **IST** (`+05:30`)      |
| `TIMESTAMP` | **UTC instant**    | 03:20 **UTC** (`Z`)           |

The fetched string carries **no timezone**. So historically, every call site had to
_know_ which convention a given column followed and pick the right parser. That
knowledge lived only in developers' heads — a **5.5-hour silent-bug** waiting to
happen (IST is UTC+5:30).

The entire system below exists to make that knowledge **travel with the data**
instead of living in someone's memory.

### Convention (the ground truth)

- `DATETIME` columns → **IST wall-clock** (India has no DST; fixed UTC+05:30).
- `TIMESTAMP` columns → **UTC instant**.
- `DATE` (calendar day) and `TIME` (clock time) → carry **no instant**, cannot be
  misparsed into the wrong moment, and are left as stock Drizzle builders.

---

## 2. Architecture at a glance

```
                         ┌───────────────────────────────────────────┐
   MySQL DB              │  DATETIME = IST wall-clock                  │
   (source of truth)     │  TIMESTAMP = UTC instant                    │
                         └───────────────────┬───────────────────────┘
                                             │  drizzle-kit pull
                                             ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  npm run db:sync                                                   │
   │    1. drizzle-kit pull   → ./drizzle/schema.ts (raw dump)          │
   │    2. scripts/sync-schema.mjs                                      │
   │         • swap datetime→istDatetime, timestamp→utcTimestamp        │
   │         • reconcile defaults / json types / sql backticks          │
   │         • delete the transient dump                                │
   │       → ./src/db/schema.ts  (pure derivative of the DB)            │
   └──────────────────────────────────┬───────────────────────────────┘
                                       │
                                       ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  src/db/columnTypes.ts  (runtime query layer)                      │
   │    READ  (fromDriver):  naive → "…+05:30"  or  "…Z"                │
   │    WRITE (toDriver):    Date/ISO/naive → zone-correct MySQL string │
   └──────────────────────────────────┬───────────────────────────────┘
                                       │  offset-stamped ISO strings
                                       ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  App code                                                          │
   │    new Date(v) / dayjs(v)  → correct absolute instant, no context  │
   │    src/utils/timeZoneHandler  → render in VIEWER's device timezone │
   │    src/lib/parseServerTimestamp, src/lib/eventTimestamps → parsers │
   └──────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer 1 — The DB column types (`src/db/columnTypes.ts`)

This is the heart of the system. Two custom Drizzle column types replace the stock
`datetime` / `timestamp`:

- **`istDatetime`** → wraps `datetime`. On read returns `"2026-07-09T03:20:00+05:30"`.
- **`utcTimestamp`** → wraps `timestamp`. On read returns `"2026-07-09T03:20:00Z"`.

These custom types **only affect the runtime query layer and the inferred row
types** — they never emit DDL. The schema file is regenerated from the DB via
`db:sync`, which reapplies the swap (see Layer 2).

### 3.1 Read path (`fromDriver`)

Makes the value **self-describing** by stamping the correct offset onto the naive
wall-clock the driver returns:

```ts
// istDatetime.fromDriver
;`${driverWallClock(value)}${offsetSuffix(IST_OFFSET_MIN)}` // → "…T03:20:00+05:30"
// utcTimestamp.fromDriver
`${driverWallClock(value)}Z` // → "…T03:20:00Z"
```

`driverWallClock(value)` normalizes **whatever mysql2 hands back** into zone-less
`YYYY-MM-DDTHH:MM:SS[.fff]` digits:

- If it's a **string** (`dateStrings` on) → trim, replace the space separator with
  `T`, strip any trailing zone suffix.
- If it's a **`Date`** (mysql2's default) → read its **UTC components**
  (`getUTCFullYear`, …). ⚠️ This is only correct if mysql2 built the Date in a **UTC
  session** — see [§6 The UTC-session assumption](#6-the-utc-session-assumption).

Result: downstream code can call `new Date(v)` / `dayjs(v)` and land on the correct
absolute instant **with zero knowledge** of the column's convention.

### 3.2 Write path (`toDriver`)

Backward-compatible with **all** legacy insert/update code. It accepts a `Date`, an
offset-bearing ISO string, **or** a legacy naive wall-clock string, and always
stores the plain `YYYY-MM-DD HH:MM:SS` shape MySQL expects for that column's zone:

```ts
// istDatetime.toDriver
toDbWallClock(toEpochMs(value, IST_OFFSET_MIN), IST_OFFSET_MIN)

// utcTimestamp.toDriver
toDbWallClock(toEpochMs(value, 0), 0)
```

- `toEpochMs(value, offsetMin)` → absolute epoch ms.
  - A `Date`, or a string **with** an explicit zone → taken as an absolute instant.
  - A **naive** string → interpreted **in the column's own zone** (`offsetMin`),
    matching what a legacy caller intended (IST for datetime, UTC for timestamp).
- `toDbWallClock(epochMs, offsetMin)` → shifts the instant back to that zone's
  wall-clock and formats it as `YYYY-MM-DD HH:MM:SS`.

### 3.3 The helper functions (exported, unit-tested)

| Function                            | Purpose                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `driverWallClock(value)`            | Driver value (string \| Date) → zone-less wall-clock ISO digits.       |
| `toEpochMs(value, offsetMin)`       | Write value → epoch ms (naive strings read in `offsetMin`'s zone).     |
| `toDbWallClock(epochMs, offsetMin)` | Epoch ms → `YYYY-MM-DD HH:MM:SS` for `offsetMin`'s zone.               |
| `istDatetime(name?)`                | Custom `DATETIME` column type (IST). Drop-in for Drizzle `datetime`.   |
| `utcTimestamp(name?)`               | Custom `TIMESTAMP` column type (UTC). Drop-in for Drizzle `timestamp`. |

Internal helpers: `pad`, `utcWallClock` (reads a Date's UTC components),
`offsetSuffix` (`+HH:MM` / `-HH:MM` / `Z`). `IST_OFFSET_MIN = 5*60 + 30 = 330`.

### 3.4 Defaults caveat

`customType` has **no** `.defaultNow()` / `.onUpdateNow()`. Use the native SQL forms
instead (identical behaviour; `CURRENT_TIMESTAMP` is UTC in a UTC session):

```ts
.default(sql`CURRENT_TIMESTAMP`)
.$onUpdateFn(() => sql`CURRENT_TIMESTAMP`)
```

The sync script rewrites these automatically (see §4).

### 3.5 Worked example

Reference instant: `2026-07-09 03:20:00 IST` === `2026-07-08 21:50:00 UTC`.

```
DATETIME column holds  "2026-07-09 03:20:00"
  fromDriver → "2026-07-09T03:20:00+05:30"
  new Date(…) → 2026-07-08T21:50:00.000Z   ✅ correct instant

TIMESTAMP column holds "2026-07-08 21:50:00"
  fromDriver → "2026-07-08T21:50:00Z"
  new Date(…) → 2026-07-08T21:50:00.000Z   ✅ same instant
```

Both resolve to the same moment — the offset stamp is what disambiguates them.

---

## 4. Layer 2 — The sync pipeline (`npm run db:sync`)

```
npm run db:sync  =  drizzle-kit pull  &&  node scripts/sync-schema.mjs
```

The DB is the **single source of truth**; `src/db/schema.ts` is a pure derivative.
You never hand-edit it.

### Step 1 — `drizzle-kit pull`

Regenerates a raw dump at `./drizzle/schema.ts` straight from the live DB (driven by
`drizzle.config.ts`, which points `schema` at `./src/db/schema.ts`, `out` at
`./drizzle`, dialect `mysql`, credentials from `DATABASE_URL`). Nothing is
hand-preserved — a table that lives only in code and not in the DB is intentionally
dropped.

### Step 2 — `scripts/sync-schema.mjs`

Rewrites the dump into `./src/db/schema.ts`, all mechanical and reapplied every run:

1. **Swap the import** (the key move):

   ```ts
   import {
     istDatetime as datetime,
     utcTimestamp as timestamp,
   } from './columnTypes'
   ```

   Because the wrappers are **aliased** to `datetime` / `timestamp`, every
   `datetime(...)` / `timestamp(...)` call site in the pulled table bodies resolves
   to the custom types **without editing a single table body**.

2. **`escapeSqlTemplateBackticks()`** — `drizzle-kit pull` emits MySQL
   backtick-quoted identifiers _inside_ `` sql`...` `` templates without escaping,
   which prematurely closes the JS template literal (e.g. `` votes.`voteTarget` ``).
   This escapes any backtick between the opening `` sql` `` and the final backtick on
   the same line.

3. **`reconcileCustomTypes()`** — reconciles the dump with the custom types:
   - `.default((someFunc()))` → `.default(sql`(someFunc())`)` (wrap unwrapped
     SQL-function defaults so they compile).
   - `.defaultNow()` → `.default(sql`CURRENT_TIMESTAMP`)` (customType has no
     `.defaultNow()`).
   - `.onUpdateNow()` → dropped (MySQL manages `ON UPDATE CURRENT_TIMESTAMP`).
   - `json(...)` → `json(...).$type<Record<string, any>>()` (pull infers `unknown`,
     which breaks every `row.jsonCol.someKey` access).

4. **Rebuild the `mysql-core` import** from the dump's list, minus the swapped
   `datetime`/`timestamp`, keeping only identifiers actually referenced (drops dead
   imports). Adds `import { sql } from "drizzle-orm"` if the body uses `sql`.

5. **Delete the transient dump** (`./drizzle/schema.ts`) so only **one** schema file
   ever exists on disk. Drizzle's migration meta (`./drizzle/meta`) and generated SQL
   are untouched.

6. **Report dropped tables** — tables present in the previous `schema.ts` but no
   longer in the DB are logged as a warning (their code will fail at runtime).

**Guard rails:** the script aborts if the dump has 0 tables (so it never clobbers a
good `schema.ts`), if the dump file is missing, or if it can't find the
`drizzle-orm/mysql-core` import.

> **Related script:** `npm run db:pull` runs _only_ `drizzle-kit pull` (raw dump,
> no swap). Use `db:sync` for the full, safe regeneration.

---

## 5. Layer 3 — App-side parsing & display

Because Layer 1 emits offset-stamped ISO strings, most consumers can simply do
`new Date(v)`. Everything beyond that — parsing legacy naive strings, and rendering
in the viewer's timezone — lives in **one folder**: `src/utils/timeZoneHandler/`.
dayjs (`utc` + `timezone` plugins) is the **only** datetime dependency; we never
hand-roll month tables, zero-padding, or AM/PM (dayjs `.format()` does it). The
formerly separate `src/lib/parseServerTimestamp.ts` and `src/lib/eventTimestamps.ts`
were folded in here so there is a single home for time logic.

### 5.0 The three parsers (one shared core)

All three sit in `timeZoneHandler/index.ts` and share a single internal
`parseUtcDbInstant` for the zone-suffix / naive-datetime handling:

| Export                            | Zone of naive strings | Far-future → local fallback | Returns         |
| --------------------------------- | --------------------- | --------------------------- | --------------- |
| `parseMysqlDatetimeIST`           | **IST**               | n/a                         | `Dayjs \| null` |
| `parseServerTimestamp`            | **UTC**               | **yes** (dev-DB safety net) | `Date \| null`  |
| `parseMasaiverseEventDbTimestamp` | **UTC**               | no (events are future)      | `Date \| null`  |

> The old `eventDbTimestampToMs` helper was **removed** — it had zero consumers.

### 5.1 `src/utils/timeZoneHandler/index.ts` — the UI formatter

Uses `dayjs` with the `utc` and `timezone` plugins. `IST = 'Asia/Kolkata'`.

**Parsing:**

- `parseMysqlDatetimeIST(raw)` — parses a naive IST MySQL string to the correct UTC
  moment via `dayjs.tz(stripped, 'Asia/Kolkata')` (strips any pre-existing zone
  suffix first). Returns a `Dayjs` or `null`.
- `getAdjustedNow(serverTimeISO, fetchedAt)` — keeps "now" current **between polls**
  by adding elapsed device-side ms to a server timestamp, so the UI doesn't have to
  trust the (possibly wrong) device clock.

**Viewer-timezone handling** (works off the _device_ timezone — there is no stored
per-user timezone preference):

- `toLocalDayjs(d)` _(internal)_ — render any instant in the device's local zone.
- `isIstTimezone()` — is the device at offset `-330`? (`getTimezoneOffset()` returns
  minutes behind UTC, negative when ahead). Treats any +5:30 zone (e.g. Colombo) as
  IST since the displayed clock is identical — used to decide whether an IST tooltip
  is even needed.
- `getTzLabel()` — device tz abbreviation ("BST", "EDT", "IST") via `Intl`, with a
  fallback that initials a long zone name when only "GMT+X" is available.

**Formatters** come in **paired Local / IST** variants — the Local one shows the
viewer's clock with a tz label; the IST one (used for hover tooltips) always shows
IST, so a non-IST viewer sees their own time **plus** an unambiguous IST tooltip:

| Local (viewer tz)          | IST (tooltip)            | Shape                                  |
| -------------------------- | ------------------------ | -------------------------------------- |
| `formatTimeRangeLocal`     | `formatTimeRangeIST`     | `5:13 PM - 6:12 PM (IST)`              |
| `formatScheduleRangeLocal` | `formatScheduleRangeIST` | `2 Jul, 6:30 PM - 7:30 PM (IST)`       |
| `formatLectureRangeLocal`  | — (server has its own)   | `10 May 2026, 3:30 PM - 5:30 PM (IST)` |
| `formatTimestampLocal`     | `formatTimestampIST`     | `6 Jun, 9:54 AM (IST)`                 |

All Local formatters read the device timezone, so they **must run client-side**.
Cross-day ranges automatically include the end date. Internally every `…Local` /
`…IST` pair shares two helpers — `formatHour` ("7AM" / "7:30 AM") and `formatDate`
("6 Jun" / "6 Jun 2026") — differing only in the dayjs handed to them (device-local
vs IST) and the trailing label. (Previously these were duplicated as
`formatHourLocal`/`formatHourIST`, etc.; now deduplicated.)

**Date-key / window helpers** (viewer-relative "today / this week"):

- `isTodayLocal(raw, now?)` — does an IST datetime fall on the viewer's local
  calendar day? (A session at IST early-morning may be the prior/next local day
  abroad.)
- `getTodayDateKeyTz(now)` — `"YYYY-MM-DD"` for today in device local tz.
- `getWeekWindowTz(now)` — rolling 7-day window `{ weekStart, weekEnd }` in device
  local tz.

### 5.2 `parseServerTimestamp` — general server-timestamp parser

- If the string has a zone suffix → trust it (`new Date(raw)`).
- If it's a naive `YYYY-MM-DD HH:MM:SS` → interpret as **UTC**, _unless_ that lands
  more than `futureSkewMs` (default 1h) in the future, in which case fall back to
  **local** interpretation. This guard protects dev DBs configured to local time.
- Anything else → best-effort `new Date(raw)`.

Consumer: `src/lib/socialRelativeTime.ts`.

### 5.3 `parseMasaiverseEventDbTimestamp` — Masaiverse events (strict UTC)

`events.start_time` / `end_time` are UTC wall-clock (MySQL `TIMESTAMP` + UTC
session). This is the strict variant that **always** parses naive values as UTC
(**no** future-skew fallback) — the fallback would misread far-future events (e.g.
show 08:30 instead of 14:00 IST for `2026-04-21 08:30:00`). Consumers: the
`masaiverse-v2` event services.

---

## 6. The UTC-session assumption ⚠️

The read path in `columnTypes.ts` reads a `Date`'s **UTC components** when mysql2
returns a `Date` (its default; `dateStrings` is off). That is correct **only if
mysql2 built the Date in a UTC session.**

Current state:

- `src/db/index.ts` creates the pool **without** setting `timezone: 'Z'` or
  `dateStrings: true`.
- No `TZ=UTC` was found in `.env*` or `ecosystem.config.cjs`.

So the read path **silently relies on the Node process running in UTC**. If a
prod/dev host is not UTC, `getUTC*` on the driver-built Date would be shifted and
reads would be wrong.

**Recommended hardening** (pick one, on the pool in `src/db/index.ts`):

```ts
mysql.createPool({ uri: databaseUrl, timezone: 'Z' /* … */ }) // mysql2 builds Dates as UTC
// or
mysql.createPool({ uri: databaseUrl, dateStrings: true /* … */ }) // driver returns raw strings
```

Either removes the dependence on the ambient process timezone. Until then, ensure
the runtime sets `TZ=UTC`.

---

## 7. Practical rules for developers

- **Never hand-edit `src/db/schema.ts`.** Change the DB, then run `npm run db:sync`.
- **Reading a time column?** You get an offset-stamped ISO string — just
  `new Date(v)` / `dayjs(v)`. Do **not** re-guess the zone.
- **Writing a time column?** Pass a `Date`, an offset-bearing ISO, or a naive string
  in the column's own zone. The write path stores the right wall-clock.
- **Displaying to a user?** Use `timeZoneHandler` — `…Local` for the viewer's clock,
  the `…IST` pair for the tooltip. These are **client-side only**.
- **New `DATETIME`?** It means **IST wall-clock**. **New `TIMESTAMP`?** It means
  **UTC**. Pick deliberately; `db:sync` will wrap it correctly.
- **Defaults:** use `.default(sql`CURRENT_TIMESTAMP`)` /
  `.$onUpdateFn(() => sql`CURRENT_TIMESTAMP`)`, not `.defaultNow()`/`.onUpdateNow()`
  (the sync script rewrites these anyway).

---

## 8. File map

| File                                                    | Role                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/db/columnTypes.ts`                                 | Custom `istDatetime`/`utcTimestamp` types + read/write helpers.         |
| `src/db/columnTypes.test.ts`                            | Unit tests for `driverWallClock`, `toEpochMs`, `toDbWallClock`.         |
| `src/db/schema.ts`                                      | Generated schema (pure derivative of the DB). **Do not edit.**          |
| `src/db/index.ts`                                       | mysql2 pool + Drizzle instance (see §6 re: session timezone).           |
| `scripts/sync-schema.mjs`                               | Reapplies the type swap + reconciliations after `drizzle-kit pull`.     |
| `drizzle.config.ts`                                     | drizzle-kit config (schema path, out dir, credentials).                 |
| `src/utils/timeZoneHandler/index.ts`                    | **Single app-side home:** all 3 parsers + viewer-tz formatters (dayjs). |
| `src/utils/timeZoneHandler/parsers.test.ts`             | Tests for the UTC parsers.                                              |
| `src/utils/timeZoneHandler/formatScheduleRange.test.ts` | Tests for the formatters.                                               |

---

## 9. Mental model (TL;DR)

1. **DB truth:** `DATETIME` = IST wall-clock, `TIMESTAMP` = UTC instant.
2. **`columnTypes.ts`** makes each self-describing on read (`+05:30` / `Z`) and
   zone-correct on write — no call site needs the convention.
3. **`db:sync`** regenerates the schema from the DB and reapplies that swap.
4. **App code** gets offset-stamped ISO → `new Date()`/`dayjs()` just work;
   `timeZoneHandler` renders in the **viewer's device timezone** with IST tooltips.
5. **Watch item:** the read path assumes a UTC mysql2/process session, but the pool
   doesn't enforce it — the one place to tighten (§6).
