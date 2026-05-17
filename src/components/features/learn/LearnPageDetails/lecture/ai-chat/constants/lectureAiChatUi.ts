/** Set to `false` to skip the opening gif and show messages immediately. */
export const LECTURE_CHAT_OPENING_LOADER_ENABLED = true

/** Gif file name in `/public` (e.g. `dance-dancing.gif` → `/dance-dancing.gif`). */
export const LECTURE_CHAT_OPENING_LOADER_GIF = 'pengu-pudgy.gif'

/** How long the opening gif sweeps left → right before messages show (milliseconds). */
export const LECTURE_CHAT_OPENING_LOADER_SWEEP_MS = 3000

/** Height of the opening gif while it sweeps (pixels; width stays proportional). */
export const LECTURE_CHAT_OPENING_LOADER_SIZE_PX = 200

/** Resolves a public-folder gif name or path to a URL for `<img src>`. */
export function lectureChatOpeningLoaderSrc(gif: string): string {
  if (gif.startsWith('/') || gif.startsWith('http://') || gif.startsWith('https://')) {
    return gif
  }
  return `/${gif}`
}
