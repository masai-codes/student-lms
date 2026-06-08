import { useState } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { uploadMasaiverseV2Image } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

type ImageUploadFieldProps = {
  value: string | null
  onChange: (url: string) => void
  label?: string
}

/**
 * Reusable image field: shows the current image, lets the user pick a file
 * (uploaded to S3 via the shared upload API), and also accepts a pasted URL.
 * Use anywhere an image URL is edited.
 */
export default function ImageUploadField({
  value,
  onChange,
  label,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const { url } = await uploadMasaiverseV2Image(file)
      onChange(url)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label ? (
        <p className="mb-1 text-[12px] font-semibold text-[#6B7280]">{label}</p>
      ) : null}
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={label ?? 'Uploaded image'}
            className="h-16 w-16 shrink-0 rounded-lg border border-[#E5E7EB] object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] text-[#9CA3AF]">
            <UploadSimple size={18} />
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] font-semibold text-[#374151] hover:bg-[#F9FAFB]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
          {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </label>
      </div>
      <input
        type="text"
        value={value ?? ''}
        placeholder="or paste an image URL"
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111928] outline-none"
      />
      {error ? <p className="mt-1 text-[12px] text-[#DC2626]">{error}</p> : null}
    </div>
  )
}
