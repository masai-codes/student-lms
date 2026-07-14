# Masaiverse v2 — Google Analytics Event Tracking (QA Reference)

This document lists every Google Analytics (GA4) event fired across **Masaiverse
v2**, what triggers it, and the exact parameters sent. Use it to verify in QA
that events fire correctly and carry the right data, so the data team can build
funnels on top of them.

---

## How it works (read first)

- All events are sent via `gtag('event', <event_name>, <params>)`.
- Every event name is prefixed with **`masaiverse_`**.
- **`user_id`** is automatically attached to **every** event (the signed-in
  user's id) — you don't need to look for it in the trigger description below; it
  is always there.
- All parameter **values are sent as strings** (e.g. `"true"`, `"124"`).
- Parameters that are empty/null/undefined are **omitted** (e.g. a community
  discussion has no `club_id`, so that key won't appear).
- A standard `page_view` event also fires on every Masaiverse route change
  (path, location, title) — that's separate from the funnel events below.

### How to verify events in QA

**Option A — GA DebugView (best):**

1. Open the site in Chrome.
2. Install the **Google Analytics Debugger** extension and enable it (or append
   `?gtm_debug=x` / use GA4 DebugView with debug mode on).
3. In GA4 → Admin → **DebugView**, watch events stream in as you click.
4. Click each element in the table below and confirm the event name **and** the
   listed parameters appear with correct values.

**Option B — Browser console / network (no GA access needed):**

1. Open DevTools → **Console** and run:
   ```js
   window.__gaEvents = []
   const orig = window.gtag
   window.gtag = function (...args) {
     if (args[0] === 'event') {
       console.log('GA EVENT:', args[1], args[2])
       window.__gaEvents.push(args)
     }
     return orig?.apply(this, args)
   }
   ```
2. Now click around. Every event prints as `GA EVENT: <name> { ...params }`.
3. After testing, run `window.__gaEvents` to see the full list captured.

**Option C — Network tab:** filter requests by `google-analytics.com/g/collect`
(or `collect?`). Each event is a request; the event name is the `en=` query
param and custom params appear as `ep.<key>=<value>`.

> Note: events only fire in the **browser** and only when GA (`window.gtag`) is
> loaded. They are silent no-ops in SSR/tests.

---

## Parameter value glossary

These recurring values help interpret the tables:

| Param                   | Possible values                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `surface`               | `sidebar`, `mobile_tabbar`, `mobile_more`                                                                                                                |
| `source` (cards)        | `home_events`, `home_highlights`, `home_active_clubs`, `clubs`, `events_list`, `weekly_connect`, `calendar_day`, `calendar_upcoming`, `sidebar_my_clubs` |
| `direction`             | `prev`, `next`                                                                                                                                           |
| `vote`                  | `upvote`, `downvote`                                                                                                                                     |
| `target` (vote)         | `post`, `reply`                                                                                                                                          |
| `tab` (events)          | `upcoming`, `past`                                                                                                                                       |
| `scope` (events filter) | `all`, `public`, `clubs`                                                                                                                                 |
| `period` (leaderboard)  | `overall`, `month`                                                                                                                                       |
| `scope` (leaderboard)   | `global`, `club`, `home_calendar`                                                                                                                        |
| `link_type`             | `join` (online event), `directions` (offline event)                                                                                                      |
| `mode` (event)          | `online`, `offline`                                                                                                                                      |

---

## 1. Navigation

| Event name                 | Trigger (what to click)                                                             | Parameters sent                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `masaiverse_nav_click`     | A **sidebar** nav item (desktop): Home / Clubs / Events / Discussions / Leaderboard | `item` = the label (e.g. `Home`), `surface` = `sidebar`, `to` = destination path        |
| `masaiverse_nav_click`     | A **mobile bottom-bar** primary tab (Home / Clubs / Events)                         | `item` = `home`/`clubs`/`events`, `surface` = `mobile_tabbar`, `to` = path              |
| `masaiverse_nav_click`     | Mobile bottom-bar **"Masai"** back arrow                                            | `item` = `back_to_masai`, `surface` = `mobile_tabbar`                                   |
| `masaiverse_nav_click`     | Mobile bottom-bar **"More"** button                                                 | `item` = `more`, `surface` = `mobile_tabbar`                                            |
| `masaiverse_nav_click`     | An item inside the mobile **"More"** sheet (Discussions / Leaderboard)              | `item` = `discussions`/`leaderboard`, `surface` = `mobile_more`, `to` = path            |
| `masaiverse_back_click`    | **"Back to clubs"** on a club detail page                                           | `to` = `clubs`                                                                          |
| `masaiverse_back_click`    | **"Back to events"** on an event detail page                                        | `to` = `events`                                                                         |
| `masaiverse_back_click`    | **"Back to club"** on a club gallery page                                           | `to` = `club`, `club_id`                                                                |
| `masaiverse_see_all_click` | **"Explore clubs"** in the sidebar "My Clubs" section                               | `section` = `sidebar_my_clubs`, `to` = `clubs`                                          |
| `masaiverse_see_all_click` | **"All clubs →"** in the home Active Clubs header                                   | `section` = `home_active_clubs`, `to` = `clubs`                                         |
| `masaiverse_see_all_click` | **"View all →"** on a Community Discussions section                                 | `section` = `discussions`, `to` = `discussions`, `club_id` (only when scoped to a club) |

---

## 2. Content cards → detail navigation

| Event name                    | Trigger (what to click)                                                                     | Parameters sent                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `masaiverse_club_card_click`  | A club card in the **sidebar "My Clubs"** list                                              | `club_id`, `source` = `sidebar_my_clubs`                                                                                                             |
| `masaiverse_club_card_click`  | A club card in the **home Active Clubs** carousel                                           | `club_id`, `source` = `home_active_clubs`                                                                                                            |
| `masaiverse_club_card_click`  | A club card on the **Clubs (Explore)** page                                                 | `club_id`, `source` = `clubs`                                                                                                                        |
| `masaiverse_event_card_click` | An event card in the **home "Live & Upcoming"** carousel                                    | `event_id`, `source` = `home_events`                                                                                                                 |
| `masaiverse_event_card_click` | A past-event card in the **home Highlights** carousel                                       | `event_id`, `source` = `home_highlights`                                                                                                             |
| `masaiverse_event_card_click` | An event card on the **Events** list page                                                   | `event_id`, `source` = `events_list`                                                                                                                 |
| `masaiverse_event_card_click` | A **Weekly Connect** row on a club page                                                     | `event_id`, `source` = `weekly_connect`                                                                                                              |
| `masaiverse_event_card_click` | An event link in the **calendar day** list                                                  | `event_id`, `source` = `calendar_day`                                                                                                                |
| `masaiverse_event_card_click` | An event in the **calendar "Upcoming events"** list                                         | `event_id`, `source` = `calendar_upcoming`                                                                                                           |
| `masaiverse_carousel_nav`     | Any carousel **prev/next arrow** (banners, home clubs, events, highlights, weekly connects) | `carousel` = `banners` / `home_clubs` / `events` / `club-events` / `highlights` / `club-highlights` / `weekly-connects`, `direction` = `prev`/`next` |

> The `carousel` value mirrors the carousel's internal key, so home vs club
> instances are distinguishable (e.g. `events` on home, `club-events` on a club page).

---

## 3. Clubs

| Event name                               | Trigger                                                                                                             | Parameters sent                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `masaiverse_club_join_click`             | Clicking **"Join"** on a club (banner or locked-section unlock). Fires on the click, before any confirmation modal. | `club_id`, `has_confirmation` = `true`/`false` (whether a confirm dialog will be shown) |
| `masaiverse_club_join_success`           | Membership **successfully created** (server confirmed the join)                                                     | `club_id`                                                                               |
| `masaiverse_club_share_click`            | **"Share Club"** button (copies the club link)                                                                      | `url` = the copied club URL                                                             |
| `masaiverse_club_gallery_open`           | **"View gallery →"** link in the Club Photos section                                                                | `club_id`, `source` = `view_gallery_link`                                               |
| `masaiverse_club_gallery_open`           | The **"+N more photos"** overlay tile                                                                               | `club_id`, `source` = `photo_overlay`                                                   |
| `masaiverse_club_create_click` _(admin)_ | **"Add a club"** button                                                                                             | _(none)_                                                                                |
| `masaiverse_club_edit_click` _(admin)_   | **"Edit club"** button on a club page                                                                               | `club_id`                                                                               |
| `masaiverse_club_update` _(admin)_       | Club edit form **saved successfully**                                                                               | `club_id`, `is_published` = `true`/`false`                                              |

**Join funnel:** `masaiverse_club_join_click` → (optional confirm) → `masaiverse_club_join_success`.

---

## 4. Events

| Event name                                | Trigger                                                                                    | Parameters sent                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `masaiverse_events_tab_change`            | **Upcoming / Past** tab on the Events page                                                 | `tab` = `upcoming`/`past`                                                    |
| `masaiverse_events_scope_change`          | **All / Community / Clubs** filter chip on the Events page                                 | `scope` = `all`/`public`/`clubs`                                             |
| `masaiverse_events_search`                | Typing in the Events **search** box (fires ~400ms after typing stops; non-empty only)      | `query` = the search text                                                    |
| `masaiverse_event_register_click`         | **"Register"** button on an event. Fires on the click, before any confirmation modal.      | `event_id`, `mode` = `online`/`offline`, `has_confirmation` = `true`/`false` |
| `masaiverse_event_register_success`       | Registration **successfully created** (server confirmed)                                   | `event_id`, `mode`, `club_id` (when the event belongs to a club)             |
| `masaiverse_event_external_link_click`    | **"Join event"** (online) or **"Get directions"** (offline) button shown after registering | `event_id`, `link_type` = `join`/`directions`                                |
| `masaiverse_event_rating_submit`          | **"Submit rating"** on an ended event (fires on success)                                   | `event_id`, `rating` = `1`–`5`                                               |
| `masaiverse_event_create_click` _(admin)_ | **"Add an event"** button                                                                  | _(none)_                                                                     |
| `masaiverse_event_edit_click` _(admin)_   | **"Edit event"** button on an event page                                                   | `event_id`                                                                   |
| `masaiverse_event_update` _(admin)_       | Event edit form **saved successfully**                                                     | `event_id`, `is_published` = `true`/`false`                                  |

**Register funnel:** `masaiverse_event_register_click` → (optional confirm) → `masaiverse_event_register_success` → `masaiverse_event_external_link_click`.

---

## 5. Discussions

| Event name                             | Trigger                                                                                    | Parameters sent                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `masaiverse_discussions_tab_change`    | A tab on the **Discussions page** (Public or a club)                                       | `tab` = `public`/`club`, `club_id` (only for a club tab)                                 |
| `masaiverse_discussion_compose_open`   | **"+ Start a discussion"** button                                                          | `club_id` (only when posting inside a club)                                              |
| `masaiverse_discussion_create`         | A discussion **posted successfully**                                                       | `club_id` (only when scoped to a club)                                                   |
| `masaiverse_discussion_search`         | Typing in the discussions **search** box (fires ~300ms after typing stops; non-empty only) | `query`, `club_id` (when scoped)                                                         |
| `masaiverse_discussion_replies_toggle` | **"N replies" / "Hide replies"** toggle on a discussion                                    | `post_id`, `open` = `true` (opening) / `false` (closing)                                 |
| `masaiverse_discussion_reply_create`   | A reply **posted successfully**                                                            | `post_id`                                                                                |
| `masaiverse_discussion_vote`           | **Upvote / downvote** arrow on a discussion **or** a reply                                 | `vote` = `upvote`/`downvote`, `target` = `post`/`reply`, `target_id` = the post/reply id |
| `masaiverse_discussion_expand_toggle`  | **"View more / View less"** on a long discussion body                                      | `expanded` = `true`/`false`                                                              |
| `masaiverse_discussion_load_more`      | **"Load more"** button at the bottom of a feed                                             | `club_id` (when scoped)                                                                  |

These events fire identically from the **home** Community Discussions section,
the **Discussions page**, and a **club's** discussions section. Use `club_id`
(present or absent) to tell community vs club, and the page path (`page_view`)
to tell which surface.

---

## 6. Leaderboard

| Event name                                 | Trigger                                              | Parameters sent                                                                                          |
| ------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `masaiverse_leaderboard_tab_change`        | A tab on the **Leaderboard page** (Global or a club) | `tab` = `global`/`club`, `club_id` (only for a club tab)                                                 |
| `masaiverse_leaderboard_period_change`     | **Overall / This month** toggle on any leaderboard   | `period` = `overall`/`month`, `scope` = `global` / `club` / `home_calendar`, `club_id` (club scope only) |
| `masaiverse_points_assign_click` _(admin)_ | **"Assign points"** button                           | _(none)_                                                                                                 |
| `masaiverse_points_assign` _(admin)_       | Assign-points form **submitted successfully**        | `target_user_id`, `points` (can be negative), `club_id` (when scoped to a club)                          |

---

## 7. Calendar (drawer)

| Event name                       | Trigger                                                   | Parameters sent                                          |
| -------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `masaiverse_calendar_open`       | **"View calendar →"** on home "Live & Upcoming"           | `source` = `home_this_week`                              |
| `masaiverse_calendar_open`       | **"View calendar →"** on a club's Live & Upcoming section | `source` = `club_upcoming`, `club_id`                    |
| `masaiverse_calendar_open`       | **"See schedule →"** on a club's Weekly Connects section  | `source` = `weekly_connects`, `club_id`                  |
| `masaiverse_calendar_month_nav`  | Calendar **‹ / ›** month arrows                           | `direction` = `prev`/`next`                              |
| `masaiverse_calendar_day_select` | Clicking a **day cell** in the calendar                   | `date_key` = `YYYY-MM-DD`, `has_events` = `true`/`false` |

---

## 8. Banners / Announcements (home)

| Event name                                 | Trigger                                        | Parameters sent                                              |
| ------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------ |
| `masaiverse_banner_cta_click`              | A banner's **CTA button** (opens the CTA link) | `banner_id`, `banner_title`, `cta_text`, `cta_url`           |
| `masaiverse_banner_expand_toggle`          | **"View more / View less"** on a banner        | `banner_id`, `banner_title`, `expanded` = `true`/`false`     |
| `masaiverse_banner_create_click` _(admin)_ | **"Add banner"** button                        | _(none)_                                                     |
| `masaiverse_banner_edit_click` _(admin)_   | The **edit (pencil)** icon on a banner         | `banner_id`, `banner_title`                                  |
| `masaiverse_banner_save` _(admin)_         | **"Save"** in the banner edit modal            | `banner_id`, `banner_title`, `is_published` = `true`/`false` |
| `masaiverse_banner_delete` _(admin)_       | **"Delete"** in the banner edit modal          | `banner_id`, `banner_title`                                  |

> Banner carousel prev/next arrows fire `masaiverse_carousel_nav` with `carousel = banners` (see §2).

---

## 9. Admin mode

| Event name                     | Trigger                                   | Parameters sent                                         |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------------- |
| `masaiverse_admin_mode_toggle` | The **"Admin mode"** switch (admins only) | `enabled` = `true` (turning on) / `false` (turning off) |

---

## Notes for QA

- **Admin-only events** (marked _(admin)_) are only reachable for users with an
  admin role who have **Admin mode** turned on. Toggle it via the switch below
  the Masaiverse logo.
- **Success events** (`*_success`, `*_create`, `*_update`, `*_save`,
  `points_assign`, `rating_submit`) fire **only after the server confirms** the
  action. If the request fails, the success event will not fire — that's correct.
- **Click vs success:** for Join and Register, the `*_click` event fires on every
  click (intent), while the `*_success` event fires only on a completed action.
  Comparing the two is how the data team measures drop-off.
- **Debounced searches** (`events_search`, `discussion_search`) fire once the
  user pauses typing, not on every keystroke, and never for an empty query.
- **Omitted params:** if a description lists `club_id` "(when scoped)" and you're
  testing the community/global view, that param is intentionally absent.
- Pure **Cancel / Close (X)** buttons and intermediate UI (e.g. hovering a rating
  star before submitting) are intentionally **not** tracked.

---

_Source of truth: `src/components/features/masaiverse-v2/tracking.ts`
(`MASAIVERSE_EVENTS`). Events are fired through the `trackMasaiverse()` helper,
which wraps `sendTrackingEvent()` in `src/utils/tracking.ts`._
