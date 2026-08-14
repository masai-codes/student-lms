import { useState } from 'react'
import { ThemedLogo } from '@/components/common/ThemedLogo'
import { cn } from '@/lib/utils'
import { getAuthBranding } from '@/utils/authBranding'
import { getPortal } from '@/utils/portal'

interface Props {
  src: string | null
  /** Programs are identified by their title; the logo itself adds nothing for screen readers. */
  title: string
  muted?: boolean
  testId: string
}

/**
 * Logos are wordmarks, so the box is height-constrained with a free (capped)
 * width rather than square — matching the legacy LMS, which sized them 40px /
 * 56px tall with `w-auto`.
 *
 * `object-left` matters for near-square logos: those hit `max-w-[140px]` before
 * they fill it, and `object-contain` would centre the letterboxed image, leaving
 * the logo visibly indented from the card's title below it.
 */
const LOGO_BOX =
  'h-10 md:h-14 w-auto max-w-[140px] shrink-0 object-contain object-left'

/**
 * A program's logo, falling back to the current portal's own wordmark
 * (Masai / i-HUB / IIT Jodhpur) the way the legacy LMS did.
 *
 * `batches.meta.courseLogo` is admin-authored and frequently absent or a dead S3
 * URL, so a broken image is the common case rather than the edge case — the
 * fallback covers `onError` as well as a missing `src`.
 *
 * The fallback goes through `ThemedLogo` so portals with a purpose-made dark
 * wordmark get it; recolouring a light logo with `dark:invert` would flip brand
 * accents (Masai's red dot) to the wrong hue.
 */
export function CourseLogo({ src, title, muted = false, testId }: Props) {
  const [failed, setFailed] = useState(false)
  const mutedClasses = muted && 'opacity-60 grayscale'

  if (!src || failed) {
    const branding = getAuthBranding(getPortal())
    return (
      <div
        data-testid={`${testId}-fallback`}
        className={cn('flex h-10 md:h-14 shrink-0 items-center', mutedClasses)}
      >
        <ThemedLogo
          lightSrc={branding.logoSrc}
          darkSrc={branding.logoDarkSrc ?? branding.logoSrc}
          alt={branding.logoAlt}
          className={LOGO_BOX}
        />
      </div>
    )
  }

  return (
    <img
      data-testid={testId}
      src={src}
      alt={`${title} logo`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        LOGO_BOX,
        'transition-transform duration-200 group-hover:scale-105',
        mutedClasses,
      )}
    />
  )
}
