export const SEEK_ALIGNMENT_EPSILON = 0.45

export const CHROME_HIDE_AFTER_MS = 3000

// Grace period after the cursor leaves the player before the chrome fades out,
// so a quick hover-out doesn't feel like an abrupt cut.
export const CHROME_HIDE_ON_LEAVE_MS = 500

export const POINTER_MOVE_WAKE_INTERVAL_MS = 200

export const PLAYBACK_RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export const LECTURE_VIDEO_OVERFLOW_VOLUME_CSS = `
  input[type='range'].lecture-video-overflow-volume {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 22px;
    background: transparent;
    color: #ffffff;
    accent-color: #ffffff;
  }
  input[type='range'].lecture-video-overflow-volume:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.45);
    outline-offset: 2px;
    border-radius: 4px;
  }
  input[type='range'].lecture-video-overflow-volume:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  input[type='range'].lecture-video-overflow-volume::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      #ffffff 0%,
      #ffffff var(--vol-pct, 0%),
      rgba(255, 255, 255, 0.22) var(--vol-pct, 0%),
      rgba(255, 255, 255, 0.22) 100%
    );
  }
  input[type='range'].lecture-video-overflow-volume::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
    width: 14px;
    height: 14px;
    margin-top: -4px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    background: #ffffff !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  }
  input[type='range'].lecture-video-overflow-volume::-moz-range-track {
    height: 6px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.22);
  }
  input[type='range'].lecture-video-overflow-volume::-moz-range-progress {
    background: #ffffff;
    border-radius: 9999px 0 0 9999px;
  }
  input[type='range'].lecture-video-overflow-volume::-moz-range-thumb {
    box-sizing: border-box;
    width: 14px;
    height: 14px;
    border: none;
    border-radius: 50%;
    background: #ffffff !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  }
`

export const LECTURE_VIDEO_CHROME_CSS = `
  /* Native fullscreen switches are an instant jump the browser controls; a
     short fade on the player root (added via JS on every enter AND exit)
     makes the transition read as smooth. Opacity only — transform here would
     fight the .lecture-video-fs-rotate fallback. */
  @keyframes lecture-video-fs-settle {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .lecture-video-fs-settling {
    animation: lecture-video-fs-settle 300ms ease-out;
  }

  .react-player-page video::-webkit-media-text-track-display {
    display: none !important;
  }
  .react-player-page video::cue {
    visibility: hidden !important;
    opacity: 0 !important;
  }
  .lecture-video-fs-root:fullscreen {
    height: 100vh;
    width: 100%;
    max-height: 100vh;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .lecture-video-fs-root:fullscreen .lecture-video-fs-video {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }
  /* Safari fires the prefixed pseudo-class; keep as separate rules — an
     unsupported selector in a shared rule would invalidate the whole rule. */
  .lecture-video-fs-root:-webkit-full-screen {
    height: 100vh;
    width: 100%;
    max-height: 100vh;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .lecture-video-fs-root:-webkit-full-screen .lecture-video-fs-video {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
  }
  /* Fallback for touch devices where screen.orientation.lock() is rejected
     (e.g. Android Chrome in a regular, non-installed tab) — CSS-rotate the
     fullscreen container so a landscape video still fills the screen instead
     of staying letterboxed in portrait. */
  .lecture-video-fs-root:fullscreen.lecture-video-fs-rotate,
  .lecture-video-fs-root:-webkit-full-screen.lecture-video-fs-rotate {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vh;
    height: 100vw;
    transform-origin: top left;
    transform: rotate(90deg) translateY(-100%);
  }
`
