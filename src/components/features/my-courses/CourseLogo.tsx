import { GraduationCap } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  src: string | null
  /** Programs are identified by their title; the logo itself adds nothing for screen readers. */
  title: string
  muted?: boolean
  testId: string
}

/**
 * A program's logo, with a branded icon tile as the fallback. `batches.meta.courseLogo`
 * is admin-authored and frequently absent or a dead S3 URL, so a broken-image icon is
 * the common case, not the edge case — `onError` swaps to the tile.
 */
export function CourseLogo({ src, title, muted = false, testId }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        data-testid={`${testId}-fallback`}
        aria-hidden="true"
        className={cn(
          'flex size-10 md:size-14 shrink-0 items-center justify-center rounded-xl bg-brand-subtle',
          muted && 'opacity-60 grayscale',
        )}
      >
        <GraduationCap
          size={24}
          weight="duotone"
          className="text-brand transition-transform duration-200 group-hover:scale-110"
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
        'size-10 md:size-14 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105',
        muted && 'opacity-60 grayscale',
      )}
    />
  )
}
