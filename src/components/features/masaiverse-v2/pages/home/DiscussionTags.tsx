/** Pill palette; a tag is mapped to one deterministically so its color is stable.
 * Light values match the original pastel-bg/deep-text pairs exactly; in dark the
 * pastels become same-hue tinted washes with pastel foregrounds. */
const TAG_COLORS = [
  // `accent-warm/15` over the white card equals the old
  // `color-mix(masaiverse-orange 15%, white)` pastel.
  'bg-accent-warm/15 text-accent-warm',
  'bg-[#E6EEFB] text-[#2563EB] dark:bg-[#2563EB]/20 dark:text-[#8FB4F9]',
  'bg-[#E3F3E8] text-[#2E7D46] dark:bg-[#2E7D46]/25 dark:text-[#7FD6A0]',
  'bg-[#EDE6F8] text-[#6D28D9] dark:bg-[#6D28D9]/25 dark:text-[#C4A8F5]',
  'bg-[#FCE7F3] text-[#DB2777] dark:bg-[#DB2777]/20 dark:text-[#F5A3C8]',
  'bg-[#FEF3C7] text-[#B45309] dark:bg-[#B45309]/25 dark:text-[#F3C57C]',
]

function colorForTag(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash + tag.charCodeAt(i)) % TAG_COLORS.length
  }
  return TAG_COLORS[hash]
}

type DiscussionTagsProps = {
  tags: Array<string>
}

/** Reusable colored tag pills for discussions. */
export default function DiscussionTags({ tags }: DiscussionTagsProps) {
  if (tags.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${colorForTag(tag)}`}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}
