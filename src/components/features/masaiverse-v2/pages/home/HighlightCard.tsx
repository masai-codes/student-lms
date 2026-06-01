import type { HighlightCtaTone, MasaiverseHighlight } from '../../types'

const CTA_COLOR: Record<HighlightCtaTone, string> = {
  green: '#1F8A4C',
  purple: '#7C3AED',
}

type HighlightCardProps = {
  highlight: MasaiverseHighlight
}

export default function HighlightCard({ highlight }: HighlightCardProps) {
  return (
    <div
      className="flex gap-3 rounded-[14px] border border-[#EDEAE8] bg-white p-4"
      style={
        highlight.accentColor
          ? { borderLeft: `4px solid ${highlight.accentColor}` }
          : undefined
      }
    >
      <span className="text-[24px] leading-none">{highlight.emoji}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
          {highlight.category}
        </p>
        <p className="mt-1 text-[15px] font-bold leading-5 text-[#111827]">
          {highlight.title}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#6B7280]">
          {highlight.meta.map((item) => (
            <span key={item.text} className="inline-flex items-center gap-1">
              <span>{item.emoji}</span>
              {item.text}
            </span>
          ))}
          <span
            className="inline-flex items-center gap-1 font-medium"
            style={{ color: CTA_COLOR[highlight.ctaTone] }}
          >
            {highlight.ctaTone === 'green' ? '▶' : null}
            {highlight.ctaLabel}
            {highlight.ctaTone === 'purple' ? '→' : null}
          </span>
        </div>
      </div>
    </div>
  )
}
