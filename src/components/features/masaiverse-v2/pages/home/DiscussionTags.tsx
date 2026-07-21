/** Pill palette; a tag is mapped to one deterministically so its color is stable. */
const TAG_COLORS = [
  {
    bg: 'color-mix(in srgb, var(--color-masaiverse-orange) 15%, white)',
    text: 'var(--color-masaiverse-orange)',
  },
  { bg: '#E6EEFB', text: '#2563EB' },
  { bg: '#E3F3E8', text: '#2E7D46' },
  { bg: '#EDE6F8', text: '#6D28D9' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#FEF3C7', text: '#B45309' },
]

function colorForTag(tag: string): { bg: string; text: string } {
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
      {tags.map((tag) => {
        const color = colorForTag(tag)
        return (
          <span
            key={tag}
            className="rounded-full px-2.5 py-0.5 text-[12px] font-medium"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {tag}
          </span>
        )
      })}
    </div>
  )
}
