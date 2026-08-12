/**
 * A logo that has a purpose-made dark artwork (white wordmark) alongside its
 * light one.
 *
 * Both images are always in the DOM and swapped with `dark:` visibility rather
 * than picked in JS: the pre-paint theme script has already put `.dark` on
 * `<html>`, so the correct artwork is present on the very first frame with no
 * hydration mismatch and no flash of the wrong logo. (Same approach as
 * `NavbarLogo`.)
 *
 * Prefer this over recolouring a light logo with `dark:invert` — inverting also
 * flips brand accents (Masai's red dot, Masaiverse's colour blocks) to the
 * wrong hues.
 */
export function ThemedLogo({
  lightSrc,
  darkSrc,
  alt,
  className,
  loading = 'lazy',
}: {
  lightSrc: string
  darkSrc: string
  alt: string
  /** Applied to both images, so they stay the same size across themes. */
  className?: string
  /** `eager` for above-the-fold chrome; defaults to `lazy`. */
  loading?: 'eager' | 'lazy'
}) {
  return (
    <>
      <img
        src={lightSrc}
        alt={alt}
        className={`${className ?? ''} dark:hidden`.trim()}
        loading={loading}
        decoding="async"
        suppressHydrationWarning
      />
      <img
        src={darkSrc}
        alt={alt}
        // Both keep their `alt`: the inactive one is `display: none`, which
        // removes it from the accessibility tree, so exactly one name is
        // announced in either theme.
        className={`hidden dark:block ${className ?? ''}`.trim()}
        loading={loading}
        decoding="async"
        suppressHydrationWarning
      />
    </>
  )
}
