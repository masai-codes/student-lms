# Announcement Popups (global queued modal)

Last updated: 2026-07-07

## Scope

- Global announcement popups shown on every authenticated page via
  `AnnouncementModalController` (mounted in `(protected)/_layout/route.tsx`).
- `useAnnouncementPopups` drives a queue: it fetches pending popups
  (announcements + direct messages flagged as popups) and shows them **one at a
  time**.
- Popups are strictly sequential: actioning one (Mark as read / CTA / Show me
  later) starts the modal's close animation (`open=false`, current item kept),
  and the next queued popup only surfaces after the close-animation window
  (`CLOSE_ANIMATION_MS = 300`) elapses — so two popups never appear together.
- Mark read / CTA permanently dismiss (server-side read); "Show me later" hides
  for the session only (reappears on reload). CTA also opens its link.
- Central `ModalContext` stack ensures the announcement popup yields to any
  higher-priority modal until that one closes.

## Test files

| File | Covers |
|------|--------|
| `src/components/modals/useAnnouncementPopups.test.tsx` | Queue advances one at a time; mark-read/message-read endpoints; CTA opens link + marks read; show-later advances without marking read; `open` stays true while shown; close-animation gap (open=false, current kept) before the next popup surfaces |
| `src/components/modals/AnnouncementPopupModal.test.tsx` | Title + "Show me later", no close (X); Mark as read vs CTA rendering + handlers; renders nothing without an item |
| `src/components/modals/ModalContext.test.tsx` | Central modal stack: topmost renders, lower ones resume on close |

## Commands

```bash
npm run test -- src/components/modals
npm run typecheck
npm run lint
```

## Manual QA

1. Trigger multiple pending popups. Only one modal is visible at a time.
2. Click "Mark as read" — the popup animates closed, then the next one animates
   in smoothly (no overlap / no instant content swap).
3. Click a CTA popup — its link opens in a new tab, it marks read, and the next
   popup follows after the close animation.
4. Click "Show me later" (or backdrop / escape) — the popup closes without
   marking read; it reappears after a reload while the next queued one shows now.
5. Open a higher-priority modal — the announcement popup stays suppressed until
   that modal closes, then resumes.

Update this file and `feature-test-matrix.md` when announcement popup queue
behavior or tests change.
