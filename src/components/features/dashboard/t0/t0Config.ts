/**
 * Static configuration for the T0 onboarding flow.
 *
 * The welcome intro video is a fixed marketing asset (not per-user data), so it
 * lives here rather than coming from an API.
 */

export const WELCOME_INTRO_VIDEO_URL =
  'https://cdn.masaischool.com/dev/lms/tickets/58e60b9e-3e33-4129-9d10-1b328933ad45/NYODJMCVszhbjguv.mp4'

/** Confetti celebrates for 5 seconds when the welcome modal opens. */
export const WELCOME_CONFETTI_DURATION_MS = 5000

// TODO(t0): confirm the final store/profile destinations for the fixed steps.
/** "Download the mobile app" fixed-step destination. */
export const APP_DOWNLOAD_URL = 'https://play.google.com/store/apps/details?id=com.masaischool.masaiapp'
/** "Add your profile photo" fixed-step destination (in-app profile page). */
export const PROFILE_PHOTO_PATH = '/profile'
