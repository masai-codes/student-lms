/**
 * Paths under `/api/cache/*` — public, cookie-free GET endpoints that CloudFront
 * caches (see the `/api/cache/*` cache behavior in `cloudformation.yml`). Nothing
 * user-specific may be served from here: the cache key is the path alone, so two
 * students share a cached response.
 *
 * Batch-scoped resources use `<resource>/<batchId>/<sectionId>/<entityId>` so a
 * whole batch or a single section can be invalidated by prefix
 * (`/api/cache/transcript/12/34/*`), which CloudFront invalidation supports.
 * Resources keyed by a single globally-unique id (e.g. a lecture id) skip the
 * batch/section segments — there is nothing to scope a prefix invalidation to.
 */
export const CACHE_API = {
  lectureTranscript: (
    batchId: number,
    sectionId: number,
    lectureId: number,
  ): string => `/api/cache/transcript/${batchId}/${sectionId}/${lectureId}`,
  lectureAiChatSuggestions: (lectureId: number): string =>
    `/api/cache/lecture-ai-chat-suggestions/${lectureId}`,
} as const
