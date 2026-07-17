import { Plus, X } from '@phosphor-icons/react'

export type KeyValueItem = { heading: string; value: string }

type KeyValueListEditorProps = {
  label: string
  value: Array<KeyValueItem>
  onChange: (value: Array<KeyValueItem>) => void
}

/** Edits a list of `{ heading, value }` rows (e.g. the "About" card facts). */
export default function KeyValueListEditor({
  label,
  value,
  onChange,
}: KeyValueListEditorProps) {
  const patch = (index: number, next: Partial<KeyValueItem>) =>
    onChange(
      value.map((cur, idx) => (idx === index ? { ...cur, ...next } : cur)),
    )

  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold text-foreground-muted">
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item.heading}
              placeholder="Heading"
              onChange={(event) =>
                patch(index, { heading: event.target.value })
              }
              className="w-1/3 rounded-lg border border-border px-3 py-2 text-[13px] text-foreground outline-none"
            />
            <input
              type="text"
              value={item.value}
              placeholder="Value"
              onChange={(event) => patch(index, { value: event.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-[13px] text-foreground outline-none"
            />
            <button
              type="button"
              aria-label={`Remove ${label} ${index + 1}`}
              onClick={() => onChange(value.filter((_, idx) => idx !== index))}
              className="shrink-0 rounded-md border border-border p-2 text-foreground-muted hover:bg-surface-muted"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, { heading: '', value: '' }])}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-warm"
      >
        <Plus size={14} weight="bold" /> Add row
      </button>
    </div>
  )
}
