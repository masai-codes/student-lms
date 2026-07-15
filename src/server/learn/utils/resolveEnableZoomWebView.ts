/**
 * `sections.settings.enableZoomWebView` — the section-level flag that turns on the
 * embedded "Zoom Web View" live-lecture flow. When true (and the lecture is a
 * non-adaptive, non-ZEF Zoom link), the join CTA opens the old LMS's embedded
 * Zoom Web SDK page (`/lectures/:id/zoom`) instead of the raw Zoom link.
 *
 * The value lives in the free-form `sections.settings` JSON, so it must be
 * defensively narrowed to a strict boolean.
 */
export function resolveEnableZoomWebView(settings: unknown): boolean {
  if (
    settings &&
    typeof settings === 'object' &&
    'enableZoomWebView' in settings
  ) {
    return (settings as { enableZoomWebView?: unknown }).enableZoomWebView === true
  }
  return false
}
