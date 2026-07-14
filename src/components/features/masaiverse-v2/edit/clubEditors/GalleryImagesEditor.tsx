import { Plus, X } from '@phosphor-icons/react'
import ImageUploadField from '../ImageUploadField'

type GalleryImagesEditorProps = {
  label: string
  value: Array<string>
  onChange: (value: Array<string>) => void
}

/** Edits the club photo gallery — a list of S3-uploadable image URLs. */
export default function GalleryImagesEditor({
  label,
  value,
  onChange,
}: GalleryImagesEditorProps) {
  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold text-foreground-muted">
        {label}
      </p>
      <div className="flex flex-col gap-3">
        {value.map((url, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="w-full">
              <ImageUploadField
                value={url}
                onChange={(next) =>
                  onChange(
                    value.map((cur, idx) => (idx === index ? next : cur)),
                  )
                }
              />
            </div>
            <button
              type="button"
              aria-label={`Remove image ${index + 1}`}
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
        onClick={() => onChange([...value, ''])}
        className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-warm"
      >
        <Plus size={14} weight="bold" /> Add image
      </button>
    </div>
  )
}
