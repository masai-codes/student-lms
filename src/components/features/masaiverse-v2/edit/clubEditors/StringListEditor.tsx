import { Plus, X } from '@phosphor-icons/react'

type StringListEditorProps = {
  label: string
  value: Array<string>
  onChange: (value: Array<string>) => void
  placeholder?: string
}

/** Edits an ordered list of free-text strings (e.g. banner tags, session tags). */
export default function StringListEditor({
  label,
  value,
  onChange,
  placeholder,
}: StringListEditorProps) {
  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold text-[#6B7280]">{label}</p>
      <div className="flex flex-col gap-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              placeholder={placeholder}
              onChange={(event) =>
                onChange(
                  value.map((cur, idx) => (idx === index ? event.target.value : cur)),
                )
              }
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111928] outline-none"
            />
            <button
              type="button"
              aria-label={`Remove ${label} ${index + 1}`}
              onClick={() => onChange(value.filter((_, idx) => idx !== index))}
              className="shrink-0 rounded-md border border-[#E5E7EB] p-2 text-[#6B7280] hover:bg-[#F9FAFB]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, ''])}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-masaiverse-orange"
      >
        <Plus size={14} weight="bold" /> Add
      </button>
    </div>
  )
}
