type EventAttendeesProps = {
  count: number
}

/** Decorative gradient palette for the overlapping attendee bubbles. */
const BUBBLE_GRADIENTS = [
  'from-[#F97316] to-[#FDBA74]',
  'from-[#6366F1] to-[#A5B4FC]',
  'from-[#10B981] to-[#6EE7B7]',
  'from-[#EC4899] to-[#F9A8D4]',
]

/**
 * Prominent "people registered" stat for the registration card — a row of
 * decorative overlapping bubbles (a visual motif, not real attendee photos)
 * beside a large bold count. Renders nothing until there's at least one
 * registration.
 */
export default function EventAttendees({ count }: EventAttendeesProps) {
  if (count === 0) return null

  const bubbles = Math.min(count, BUBBLE_GRADIENTS.length)
  const noun = count === 1 ? 'person' : 'people'
  const formatted = count.toLocaleString('en-IN')

  return (
    <div
      aria-label={`${formatted} ${noun} registered`}
      className="mt-4 flex items-center gap-3 rounded-[14px] bg-gradient-to-r from-accent-warm/[0.10] via-accent-warm/[0.04] to-transparent px-4 py-3"
    >
      <div className="flex -space-x-2.5" aria-hidden="true">
        {Array.from({ length: bubbles }).map((_, index) => (
          <span
            key={index}
            className={`size-8 rounded-full bg-gradient-to-br ring-2 ring-surface ${
              BUBBLE_GRADIENTS[index % BUBBLE_GRADIENTS.length]
            }`}
          />
        ))}
      </div>
      <p className="leading-none">
        <span className="text-[24px] font-extrabold tracking-tight text-foreground">
          {formatted}
        </span>
        <span className="ml-1.5 text-[13px] font-medium text-foreground-muted">
          {noun} registered
        </span>
      </p>
    </div>
  )
}
