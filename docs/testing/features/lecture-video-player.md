# Lecture video player and attendance

## Scope

- Custom React Player chrome (play/pause, scrub with attendance segments, volume, playback speed, fullscreen, theater toggle).
- Video attendance progress persistence via `experience-api` `/video-attendances` REST routes (proxied through TanStack server functions).
- Resume from `lastWatchedPosition`, interval merge UI (green watched, gray unwatched gaps).

## Tests

- `src/lib/video-attendance/__tests__/*`
- `src/server/video-attendance/services/__tests__/fetchVideoProgress.test.ts`
- `src/components/features/learn/LearnPageDetails/lecture/video/hooks/__tests__/lectureVideoResume.test.ts`

## Manual checks

- Play a lecture recording: progress saves after ~30s of watch time; pausing forces a save.
- Reload page: player resumes near last watched position.
- Scrub bar shows green segments for previously watched ranges (when intervals exist).
- Arrow keys: ±5s seek; Space toggles play/pause (outside form fields).
