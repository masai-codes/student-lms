import { useRef } from 'react'
import {
  Code,
  Hash,
  Link,
  ListBullets,
  ListNumbers,
  PaperPlaneRight,
  Paperclip,
  TextB,
  TextItalic,
  TextUnderline,
  X,
} from '@phosphor-icons/react'

import { SUPPORT_MAX_ATTACHMENTS } from './supportAttachmentUpload'
import { cn } from '@/lib/utils'

interface ChatComposerProps {
  message: string
  onChange: (val: string) => void
  placeholder?: string
  files?: Array<File>
  onFilesSelected?: (files: Array<File>) => void
  onRemoveFile?: (index: number) => void
  onSend?: () => void
  uploading?: boolean
  uploadError?: string | null
  disabled?: boolean
}

export function ChatComposer({
  message,
  onChange,
  placeholder = 'Ask me anything...',
  files = [],
  onFilesSelected,
  onRemoveFile,
  onSend,
  uploading = false,
  uploadError = null,
  disabled = false,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gradientBg = 'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  const canSend = (message.trim().length > 0 || files.length > 0) && !uploading && !disabled
  const atFileLimit = files.length >= SUPPORT_MAX_ATTACHMENTS

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files
    if (selected?.length && onFilesSelected) {
      onFilesSelected(Array.from(selected))
    }
    event.target.value = ''
  }

  return (
    <div className="shrink-0 flex flex-col p-[16px_18px] border-t border-[#e9e9f3] bg-white animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="border border-[#e9e9f3] rounded-[16px] flex flex-col bg-white overflow-hidden focus-within:border-[#4b4396] focus-within:ring-1 focus-within:ring-[#4b4396]/20 transition-all shadow-sm">
        <textarea
          value={message}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          disabled={disabled || uploading}
          className="w-full resize-none p-[14px_16px_4px] text-[13.6px] leading-[1.5] max-h-[120px] outline-none text-[#15162c] font-[inherit] bg-transparent placeholder:text-[#9496ab] disabled:opacity-60"
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-[14px] pb-2">
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f0f0fd] px-2.5 py-1 text-[11.5px] text-[#4b4396]"
              >
                <Paperclip weight="bold" className="size-3 shrink-0" />
                <span className="truncate max-w-[160px]">{file.name}</span>
                {onRemoveFile && !uploading && !disabled ? (
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => onRemoveFile(index)}
                    className="text-[#9496ab] hover:text-[#15162c]"
                  >
                    <X weight="bold" className="size-3" />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between p-[8px_10px_8px_14px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <TextB weight="bold" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <TextItalic weight="bold" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <TextUnderline weight="bold" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <ListBullets weight="bold" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <ListNumbers weight="bold" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <Hash weight="bold" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <Code weight="bold" className="size-[15px]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors"
            >
              <Link weight="bold" className="size-[15px]" />
            </button>
            <div className="w-[1px] h-[16px] bg-[#e9e9f3] mx-1" />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              disabled={disabled || uploading || atFileLimit || !onFilesSelected}
              onChange={handleFileChange}
            />
            <button
              type="button"
              aria-label="Attach files"
              title={atFileLimit ? `Maximum ${SUPPORT_MAX_ATTACHMENTS} files` : 'Attach files'}
              disabled={disabled || uploading || atFileLimit || !onFilesSelected}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Paperclip weight="bold" className="size-[15px]" />
            </button>
          </div>

          <button
            type="button"
            disabled={!canSend}
            onClick={() => onSend?.()}
            aria-label={uploading ? 'Uploading attachments' : 'Send message'}
            className={cn(
              'flex items-center justify-center shrink-0 size-[32px] rounded-full transition-all duration-150',
              canSend
                ? 'text-white hover:scale-105 active:scale-95 cursor-pointer shadow-sm'
                : 'bg-[#f1f1f7] text-[#9496ab] cursor-not-allowed',
            )}
            style={canSend ? { background: gradientBg } : {}}
          >
            <PaperPlaneRight weight="fill" className="size-[14px] -translate-x-[1px] translate-y-[1px]" />
          </button>
        </div>
      </div>

      {uploadError ? (
        <p className="mt-2 text-[12px] text-red-600">{uploadError}</p>
      ) : null}
      {uploading ? (
        <p className="mt-2 text-[12px] text-[#62647d]">Uploading attachments…</p>
      ) : null}
    </div>
  )
}
