# Timezone Functions — Complete Reference

Every timezone-related function in the codebase lives in **2 files**. This document
lists **all 24 functions** (plus the 2 backing column-type objects), what each does,
its signature, and whether the app calls it directly.

> Companion doc: [`datetime-timezone-handling.md`](./datetime-timezone-handling.md)
> explains the overall flow and _why_ the two conventions exist.

**Convention recap:** `DATETIME` columns store **IST wall-clock**; `TIMESTAMP`
columns store **UTC instants**.

| File                                 | Functions                  | Role                          |
| ------------------------------------ | -------------------------- | ----------------------------- |
| `src/db/columnTypes.ts`              | 8 (+2 column-type objects) | DB boundary — dependency-free |
| `src/utils/timeZoneHandler/index.ts` | 16                         | App / UI — dayjs only         |

Legend: **Exported+used** = imported by app code · **Test-only** = exported solely
for unit tests · **Internal** = private (not exported).

---

## File 1 — `src/db/columnTypes.ts` (8 functions + 2 column types)

Runs inside the Drizzle/mysql2 query layer. No dependencies.

### Internal helpers

#### `pad(n, width = 2) → string` · Internal

Zero-pads a number to a fixed width. `pad(3) → "03"`. String-building primitive
used by the wall-clock formatters.

#### `utcWallClock(d: Date) → string` · Internal

Reads a `Date`'s **UTC** components into a zone-less
`YYYY-MM-DDTHH:MM:SS[.fff]` string. Keeps fractional seconds only when present.
This is how a driver-built `Date` is turned back into naked wall-clock digits.

#### `offsetSuffix(offsetMin: number) → string` · Internal

Turns a fixed minute-offset into an ISO zone suffix: `330 → "+05:30"`,
`-240 → "-04:00"`, `0 → "Z"`.

### Read / write primitives (exported for tests)

#### `driverWallClock(value: string | Date) → string` · Test-only

**The READ primitive.** Normalizes whatever mysql2 hands back — a naive string _or_
a `Date` — into zone-less wall-clock digits (`YYYY-MM-DDTHH:MM:SS[.fff]`). Strips
any existing zone suffix from strings; reads UTC components from a `Date`. The two
column types append the correct offset to its output.

#### `toEpochMs(value: string | Date, offsetMin: number) → number` · Test-only

**The WRITE primitive (parse).** Converts a value being written into absolute epoch
milliseconds. A `Date` or a zone-bearing string is an absolute instant; a **naive**
string is interpreted in `offsetMin`'s zone (so legacy callers keep working).

#### `toDbWallClock(epochMs: number, offsetMin: number) → string` · Test-only

**The WRITE primitive (format).** Inverse of `toEpochMs`: shifts an absolute instant
into `offsetMin`'s zone and formats it as the `YYYY-MM-DD HH:MM:SS` string MySQL
stores.

### The two column types (the public surface)

#### `_istDatetime` / `_utcTimestamp` — `customType(...)` objects · Internal

The Drizzle `customType` definitions that wire the primitives above into
`fromDriver` (read) and `toDriver` (write). `_istDatetime` uses IST (`+05:30`);
`_utcTimestamp` uses UTC (`Z`). Not exported directly — accessed via the two
factory functions below.

#### `istDatetime(nameOrConfig?, _config?) → column` · Exported+used

Factory for an **IST `DATETIME`** column. On read returns `"...+05:30"`; on write
accepts Date/ISO/naive and stores IST wall-clock. Drop-in for Drizzle's `datetime`.
Used once, in `src/db/schema.ts` (aliased as `datetime`), covering every IST column.

#### `utcTimestamp(nameOrConfig?, _config?) → column` · Exported+used

Factory for a **UTC `TIMESTAMP`** column. On read returns `"...Z"`; on write accepts
Date/ISO/naive and stores UTC wall-clock. Drop-in for Drizzle's `timestamp`. Used
once, in `src/db/schema.ts` (aliased as `timestamp`), covering every UTC column.

---

## File 2 — `src/utils/timeZoneHandler/index.ts` (16 functions)

dayjs (`utc` + `timezone` plugins) is the only dependency.

### Parsers — string → instant

#### `parseUtcDbInstant(value, futureFallback?) → Date | null` · Internal

Shared core for the two UTC parsers. Trusts an explicit zone suffix; reads a naive
string as UTC; with `futureFallback` set, re-reads a suspiciously-far-future value
in the host-local zone (a dev-DB safety net). Both public UTC parsers are one-liners
over this, so the regex/branch logic exists in exactly one place.

#### `parseMysqlDatetimeIST(raw) → dayjs.Dayjs | null` · Exported+used (6)

Parses a naive **IST** `DATETIME` string to the correct instant (as an IST-mode
dayjs). Strips any pre-existing offset first, so both legacy naive strings and the
offset-stamped strings the DB layer now emits resolve identically. Feeds every
formatter below; also used by `nextActionBanner`.

#### `parseServerTimestamp(value, { futureSkewMs?, nowMs? }) → Date | null` · Exported+used (4)

Parses a **UTC** server timestamp _with_ the far-future→local fallback (default
skew 1h). Used for social/relative-time, where a wrong-by-5.5h value is very
visible. Returns a native `Date`.

#### `parseMasaiverseEventDbTimestamp(value) → Date | null` · Exported+used (17)

Parses a Masaiverse event's **UTC** timestamp — **strict UTC, no fallback** (events
are legitimately in the future). Most-used function in the module; called by the
`masaiverse-v2` event services.

#### `getAdjustedNow(serverTimeISO, fetchedAt) → dayjs.Dayjs` · Exported+used (3)

Server-anchored "now": adds the ms elapsed on the device since `serverTimeISO` was
fetched, so countdowns stay correct even if the device clock is skewed.

### Viewer (device) timezone info

#### `isIstTimezone() → boolean` · Exported+used (6)

True when the device is at the IST offset (`getTimezoneOffset() === -330`). When
true, local rendering already equals IST, so no IST tooltip is needed. Client-side.

#### `getTzLabel() → string` · Exported+used (9)

The viewer's timezone abbreviation ("EDT", "IST", …) via `Intl`, with an
initials fallback for zones that only expose a "GMT+X" short name. Client-side.

### Internal formatting helpers

#### `toLocal(d: dayjs.Dayjs) → dayjs.Dayjs` · Internal

Re-expresses an instant in the viewer's device-local zone (`d.local()`).

#### `formatHour(d: dayjs.Dayjs) → string` · Internal

`"7AM"` on the hour, else `"7:30 AM"`. Zone follows whatever `d` is in — this is
what lets the `…Local`/`…IST` pairs share one code path.

#### `formatDate(d: dayjs.Dayjs, withYear) → string` · Internal

`"6 Jun"` (withYear=false) or `"6 Jun 2026"` (withYear=true).

### Display formatters (Local = viewer zone · IST = forced IST, for tooltips)

#### `formatScheduleRangeLocal(scheduleIST, concludesIST) → string` · Exported+used (7)

Schedule range with a leading date, no year, in the viewer's zone.
e.g. `"2 Jul, 6:30 PM - 7:30 PM (EDT)"`. Cross-day ranges include the end date.

#### `formatScheduleRangeIST(scheduleIST, concludesIST) → string` · Exported+used (5)

Same as above but always in IST — the tooltip counterpart.
e.g. `"2 Jul, 6:30 PM - 7:30 PM (IST)"`.

#### `formatLectureRangeLocal(scheduleIST, concludesIST) → string` · Exported+used (4)

Detail-page range _with the year_ and a tz label, in the viewer's zone.
e.g. `"10 May 2026, 3:30 PM - 5:30 PM (IST)"`. Client-side.

#### `formatTimestampLocal(raw) → string` · Exported+used (8)

A single timestamp in the viewer's zone. e.g. `"6 Jun, 9:54 AM (EDT)"`.

#### `formatTimestampIST(raw) → string` · Exported+used (8)

A single timestamp always in IST — the tooltip counterpart.
e.g. `"6 Jun, 9:54 AM (IST)"`.

### Calendar-day helper

#### `isTodayLocal(raw, now = new Date()) → boolean` · Exported+used (2)

Whether an IST datetime falls on the viewer's local calendar day as of `now`. IST
early-morning may be the prior/next local day abroad, so this is computed in the
viewer's zone, not IST. Client-side.

---

## Summary

| Category                                                                 | Count  |
| ------------------------------------------------------------------------ | ------ |
| `columnTypes.ts` — functions                                             | 8      |
| `columnTypes.ts` — column-type objects (`_istDatetime`, `_utcTimestamp`) | 2      |
| `timeZoneHandler/index.ts` — functions                                   | 16     |
| **Total functions**                                                      | **24** |

Of the 24: **14 are called directly by app code** (2 in `columnTypes` via `schema.ts`

- 12 in `timeZoneHandler`), **3 are exported for tests only** (`driverWallClock`,
  `toEpochMs`, `toDbWallClock`), and the rest are internal helpers. No dead code
  remains.
