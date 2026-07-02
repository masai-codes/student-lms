/**
 * Static configuration for the T0 onboarding flow.
 *
 * The welcome intro video is a fixed marketing asset (not per-user data), so it
 * lives here rather than coming from an API. Swap the URL when the final asset
 * is published.
 */

// TODO(t0): replace with the final published intro-video asset URL.
export const WELCOME_INTRO_VIDEO_URL =
  'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/high.mp4'

export const WELCOME_INTRO_VIDEO_POSTER_URL =
  'https://image.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/thumbnail.webp?time=0'

/** Confetti celebrates for 5 seconds when the welcome modal opens. */
export const WELCOME_CONFETTI_DURATION_MS = 5000
