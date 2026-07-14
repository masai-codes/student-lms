import { Plus, X } from '@phosphor-icons/react'
import StringListEditor from './StringListEditor'

export type LearningTenureItem = {
  emoji: string
  heading: string
  text: string
  tags: Array<string>
}

type LearningTenureEditorProps = {
  label: string
  value: Array<LearningTenureItem>
  onChange: (value: Array<LearningTenureItem>) => void
}

/** Edits the learning-tenure cards: emoji + heading + text + a list of tags. */
export default function LearningTenureEditor({
  label,
  value,
  onChange,
}: LearningTenureEditorProps) {
  const patch = (index: number, next: Partial<LearningTenureItem>) =>
    onChange(
      value.map((cur, idx) => (idx === index ? { ...cur, ...next } : cur)),
    )

  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold text-foreground-muted">
        {label}
      </p>
      <div className="flex flex-col gap-3">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.emoji}
                placeholder="⚡"
                onChange={(event) =>
                  patch(index, { emoji: event.target.value })
                }
                className="w-12 rounded-lg border border-border px-2 py-2 text-center text-[13px] outline-none"
              />
              <input
                type="text"
                value={item.heading}
                placeholder="Heading"
                onChange={(event) =>
                  patch(index, { heading: event.target.value })
                }
                className="w-full rounded-lg border border-border px-3 py-2 text-[13px] text-foreground outline-none"
              />
              <button
                type="button"
                aria-label={`Remove ${label} ${index + 1}`}
                onClick={() =>
                  onChange(value.filter((_, idx) => idx !== index))
                }
                className="shrink-0 rounded-md border border-border p-2 text-foreground-muted hover:bg-surface-muted"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={item.text}
              placeholder="Text"
              onChange={(event) => patch(index, { text: event.target.value })}
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-[13px] text-foreground outline-none"
            />
            <div className="mt-2">
              <StringListEditor
                label="Tags"
                value={item.tags}
                onChange={(tags) => patch(index, { tags })}
                placeholder="e.g. 12 sessions"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...value, { emoji: '', heading: '', text: '', tags: [] }])
        }
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-warm"
      >
        <Plus size={14} weight="bold" /> Add card
      </button>
    </div>
  )
}
