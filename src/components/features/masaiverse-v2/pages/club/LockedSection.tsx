import { LockSimple } from '@phosphor-icons/react'
import SectionHeader from '../home/SectionHeader'
import { repeat } from '../home/skeletons'
import JoinClubButton from './JoinClubButton'

type LockedSectionProps = {
  /** Club this teaser belongs to — threaded into the Join CTA. */
  clubId: string
  /** Section heading, shown un-blurred so the visitor knows what's gated. */
  title: string
  /** Curiosity-driving copy shown in the unlock overlay. */
  teaser: string
  /** Shape of the blurred placeholder behind the lock — rows or a card row. */
  variant?: 'list' | 'cards'
  /**
   * `clubs.meta.confirmationModalText` — forwarded to the Join CTA so the
   * confirm dialog (when configured) works straight from the unlock overlay.
   */
  confirmationModalText?: string | null
}

/** A blurred placeholder behind the lock overlay; never shows real data. */
function Placeholder({ variant }: { variant: 'list' | 'cards' }) {
  if (variant === 'cards') {
    return (
      <div className="flex gap-4">
        {repeat(3, (key) => (
          <div
            key={key}
            className="h-[170px] flex-1 rounded-[16px] bg-surface-muted"
          />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {repeat(3, (key) => (
        <div key={key} className="h-[72px] rounded-[16px] bg-surface-muted" />
      ))}
    </div>
  )
}

/**
 * Renders a club-page section as a locked teaser for non-members: the heading
 * stays visible while the content is replaced by a blurred placeholder behind a
 * "Join the club to unlock" overlay with a live Join CTA. The real section's
 * data is never fetched or rendered here — the server also withholds it for
 * non-members.
 */
export default function LockedSection({
  clubId,
  title,
  teaser,
  variant = 'list',
  confirmationModalText = null,
}: LockedSectionProps) {
  return (
    <section>
      <SectionHeader title={title} />
      <div className="group relative overflow-hidden rounded-[20px]">
        {/* Decorative, blurred preview of the gated content. The blur eases off
            slightly on hover to hint there's real content underneath. */}
        <div
          aria-hidden
          className="pointer-events-none select-none p-4 blur-[6px] transition-all duration-300 group-hover:blur-[4px]"
        >
          <Placeholder variant={variant} />
        </div>
        {/* Frosted unlock overlay with the live Join CTA. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-gradient-to-b from-white/70 to-white/85 px-4 py-6 text-center backdrop-blur-[2px] dark:bg-none dark:bg-surface-muted/85">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-warm/10 text-accent-warm ring-1 ring-accent-warm/20 transition-transform duration-300 group-hover:scale-110">
            <LockSimple size={24} weight="fill" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-[16px] font-extrabold leading-6 text-foreground">
              Join the club to unlock
            </p>
            <p className="mx-auto max-w-[340px] text-[13px] leading-5 text-foreground-muted">
              {teaser}
            </p>
          </div>
          <JoinClubButton
            clubId={clubId}
            isJoined={false}
            variant="primary"
            confirmationModalText={confirmationModalText}
          />
        </div>
      </div>
    </section>
  )
}
