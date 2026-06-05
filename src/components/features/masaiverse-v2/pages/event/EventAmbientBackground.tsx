type EventAmbientBackgroundProps = {
  /** The event's cover image — its colours tint the centre of the burst. */
  imageUrl?: string | null
}

/**
 * Luma-style "hyperspace" backdrop for the event page.
 *
 * Two layers of thin prismatic light rays (`.event-rays`, animated in
 * `styles.css`) burst outward from behind the cover image and rotate slowly
 * against a near-black sky. A heavily-blurred copy of the cover image sits at
 * the burst centre so the rays pick up the event's own colours, and a vignette
 * darkens the far edges for depth. Purely decorative — hidden from assistive
 * tech and click-through transparent. Renders only the dark sky (no rays) when
 * the event has no cover image.
 */
export default function EventAmbientBackground({
  imageUrl,
}: EventAmbientBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#0a0b12]"
    >
      {imageUrl ? (
        <>
          {/* Event-coloured glow at the burst centre (behind the cover image). */}
          <div
            className="absolute left-[30%] top-[42%] size-[55vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cover bg-center opacity-50 blur-[120px] saturate-150 [mask-image:radial-gradient(closest-side,#000_10%,transparent_75%)]"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
          {/* Prismatic light rays, counter-rotating for shimmer. */}
          <div className="event-rays event-rays--white animate-event-rays-cw" />
          <div className="event-rays event-rays--prism animate-event-rays-ccw" />
        </>
      ) : null}

      {/* Depth vignette: keeps the burst luminous and the edges deep. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_30%_38%,transparent_30%,rgba(7,8,16,0.55)_72%,rgba(7,8,16,0.92)_100%)]" />
    </div>
  )
}
