import { Plus, X } from '@phosphor-icons/react'
import ImageUploadField from '../ImageUploadField'

export type HostedByItem = { host: string; imageUrl: string }

type HostedByEditorProps = {
  label: string
  value: Array<HostedByItem>
  onChange: (value: Array<HostedByItem>) => void
}

/** Edits the event hosts: a name + an uploadable avatar per host. */
export default function HostedByEditor({
  label,
  value,
  onChange,
}: HostedByEditorProps) {
  const patch = (index: number, next: Partial<HostedByItem>) =>
    onChange(value.map((cur, idx) => (idx === index ? { ...cur, ...next } : cur)))

  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold text-[#6B7280]">{label}</p>
      <div className="flex flex-col gap-3">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg border border-[#E5E7EB] p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.host}
                placeholder="Host name"
                onChange={(event) => patch(index, { host: event.target.value })}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111928] outline-none"
              />
              <button
                type="button"
                aria-label={`Remove host ${index + 1}`}
                onClick={() => onChange(value.filter((_, idx) => idx !== index))}
                className="shrink-0 rounded-md border border-[#E5E7EB] p-2 text-[#6B7280] hover:bg-[#F9FAFB]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-2">
              <ImageUploadField
                value={item.imageUrl}
                onChange={(url) => patch(index, { imageUrl: url })}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, { host: '', imageUrl: '' }])}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-masaiverse-orange"
      >
        <Plus size={14} weight="bold" /> Add host
      </button>
    </div>
  )
}
