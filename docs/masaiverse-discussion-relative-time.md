# Masaiverse discussion timestamps

Discussion post and reply times on the Masaiverse home tab use `formatSocialPostTime` from `src/lib/socialRelativeTime.ts`. All comparisons use the **viewer’s local timezone** and `Date` parsing of the server’s ISO string.

## Rules (in order)

1. **Missing or invalid timestamp**  
   Show **Just now** (same as when the API omits `createdAt` or sends an unparseable value).

2. **Future time** (clock skew or bad data)  
   Show **Just now**.

3. **Under 60 seconds**  
   **Just now**

4. **1–59 minutes**  
   **1 minute ago** or **N minutes ago**

5. **Same local calendar day as “now”** and at least one hour elapsed  

   - If elapsed time is **1–5 hours** (inclusive): **1 hour ago** or **N hours ago**  
   - If elapsed time is **6 hours or more** on that same day: **Today at** plus the post’s local time  
     - Time is formatted with `toLocaleTimeString` (12-hour, 2-digit hour and minute, e.g. `04:30 PM`), respecting the user’s locale.

   The **6-hour cutoff** (`SAME_DAY_HOURS_AGO_CAP`) keeps very recent same-day activity in a familiar “X hours ago” form and switches to a stable clock time for older posts from today (similar to many social feeds).

6. **Previous local calendar day** (exactly one day before “today”)  
   **Yesterday at** plus the post’s local time (same clock formatting as above).

7. **Any other date**  
   Local date and time via `toLocaleString`: month (short), day, **year only when it differs from the current year**, plus time in 12-hour form with minutes (e.g. `Apr 5, 10:00 AM` — exact punctuation/order follows the user’s locale).

## What this does *not* do

- No live ticking (strings are computed at render; refreshing the page or re-fetching updates them).
- No “2d” / “3w” ultra-short labels; this is optimized for full phrases in the LMS UI.
- Server timezone is ignored after parsing; display is always **local** to the browser.

## Usage

`DiscussionsList` maps `DiscussionPost.createdAt` / reply `createdAt` through `formatSocialPostTime` before passing strings into `MasaiverseDiscussionPostCard` and the drawer.
