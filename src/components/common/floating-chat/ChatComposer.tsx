import { useState, useRef, useEffect } from 'react'
import {
  Code,
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

import {
  applyBulletList,
  applyCode,
  applyLink,
  applyNumberedList,
  wrapSelection,
  type TextEdit,
} from './chatComposerFormatting'
import { SUPPORT_MAX_ATTACHMENTS } from './supportAttachmentUpload'
import { SupportMarkdown } from '@/components/features/support/SupportMarkdown'
import { cn } from '@/lib/utils'

const MIN_TEXTAREA_HEIGHT = 44
const MAX_TEXTAREA_HEIGHT = 160

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
  selectedTopic?: string | null
  onClearTopic?: () => void
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
  selectedTopic = null,
  onClearTopic,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gradientBg =
    'linear-gradient(90.38deg, rgb(75, 67, 150) 2.62%, rgb(105, 98, 172) 100%)'

  const [isPreview, setIsPreview] = useState(false)
  const hasFormatting = /[*_`[\]]|<u>/.test(message)

  // Grow with the content instead of a fixed 2-row box, so a longer query
  // stays fully visible while typing; past MAX_TEXTAREA_HEIGHT it scrolls
  // internally rather than pushing the rest of the modal around.
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || isPreview) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [message, isPreview])

  const canSend =
    (message.trim().length > 0 || files.length > 0 || !!selectedTopic) &&
    !uploading &&
    !disabled
  const atFileLimit = files.length >= SUPPORT_MAX_ATTACHMENTS
  const formattingDisabled = disabled || uploading

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files
    if (selected?.length && onFilesSelected) {
      onFilesSelected(Array.from(selected))
    }
    event.target.value = ''
  }

  const applyEdit = (edit: TextEdit) => {
    onChange(edit.value)
    const textarea = textareaRef.current
    if (!textarea) return
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd)
    })
  }

  const getSelection = () => {
    const textarea = textareaRef.current
    return {
      value: message,
      start: textarea?.selectionStart ?? message.length,
      end: textarea?.selectionEnd ?? message.length,
    }
  }

  const handleFormat = (
    format:
      | 'bold'
      | 'italic'
      | 'underline'
      | 'bullet'
      | 'number'
      | 'code'
      | 'link',
  ) => {
    if (formattingDisabled) return
    const selection = getSelection()
    switch (format) {
      case 'bold':
        applyEdit(wrapSelection(selection, '**', '**', 'bold text'))
        break
      case 'italic':
        applyEdit(wrapSelection(selection, '_', '_', 'italic text'))
        break
      case 'underline':
        applyEdit(wrapSelection(selection, '<u>', '</u>', 'underlined text'))
        break
      case 'bullet':
        applyEdit(applyBulletList(selection))
        break
      case 'number':
        applyEdit(applyNumberedList(selection))
        break
      case 'code':
        applyEdit(applyCode(selection))
        break
      case 'link':
        applyEdit(applyLink(selection))
        break
    }
  }

  const handleTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (!(event.metaKey || event.ctrlKey)) return
    const key = event.key.toLowerCase()
    if (key === 'b') {
      event.preventDefault()
      handleFormat('bold')
    } else if (key === 'i') {
      event.preventDefault()
      handleFormat('italic')
    } else if (key === 'u') {
      event.preventDefault()
      handleFormat('underline')
    } else if (key === 'k') {
      event.preventDefault()
      handleFormat('link')
    }
  }

  const formatButtonClass =
    'flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors disabled:cursor-not-allowed disabled:opacity-50'

  const tabButtonClass = (active: boolean) =>
    cn(
      'px-2.5 py-[3px] text-[11.5px] font-medium rounded-[6px] transition-colors',
      active
        ? 'bg-[#f0f0fd] text-[#4b4396]'
        : 'text-[#9496ab] hover:text-[#62647d]',
    )

  return (
    <div className="shrink-0 flex flex-col p-[16px_18px] border-t border-[#e9e9f3] bg-white animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="border border-[#e9e9f3] rounded-[16px] flex flex-col bg-white overflow-hidden focus-within:border-[#4b4396] focus-within:ring-1 focus-within:ring-[#4b4396]/20 transition-all shadow-sm">
        {selectedTopic && (
          <div className="px-3 pt-3 flex items-start justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 bg-[#f0f0fd] px-3 py-1.5 rounded-[10px] text-[#4b4396] max-w-[90%]">
              <span className="text-[11.5px] font-bold uppercase tracking-wide shrink-0">
                Topic:
              </span>
              <span className="text-[13px] font-medium truncate">
                {selectedTopic}
              </span>
            </div>
            {onClearTopic && !disabled && !uploading && (
              <button
                type="button"
                onClick={onClearTopic}
                className="text-[#9496ab] hover:text-[#15162c] p-1.5 rounded-full hover:bg-gray-50 transition-colors shrink-0"
                aria-label="Remove topic"
              >
                <X weight="bold" className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {hasFormatting && (
          <div className="flex items-center gap-1 px-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={tabButtonClass(!isPreview)}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={tabButtonClass(isPreview)}
            >
              Preview
            </button>
          </div>
        )}

        {isPreview ? (
          <div
            className="overflow-y-auto p-[10px_16px_8px]"
            style={{
              minHeight: MIN_TEXTAREA_HEIGHT,
              maxHeight: MAX_TEXTAREA_HEIGHT,
            }}
          >
            {message.trim().length > 0 ? (
              <SupportMarkdown className="text-[13.6px] text-[#15162c]">
                {message}
              </SupportMarkdown>
            ) : (
              <p className="text-[13.6px] text-[#9496ab]">
                Nothing to preview yet.
              </p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={placeholder}
            disabled={disabled || uploading}
            style={{
              minHeight: MIN_TEXTAREA_HEIGHT,
              maxHeight: MAX_TEXTAREA_HEIGHT,
            }}
            className="w-full resize-none p-[14px_16px_4px] text-[13.6px] leading-[1.5] outline-none text-[#15162c] font-[inherit] bg-transparent placeholder:text-[#9496ab] disabled:opacity-60"
          />
        )}

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
            {!isPreview && (
              <>
                <button
                  type="button"
                  title="Bold (Ctrl+B)"
                  aria-label="Bold"
                  disabled={formattingDisabled}
                  onClick={() => handleFormat('bold')}
                  className={formatButtonClass}
                >
                  <TextB weight="bold" className="size-[15px]" />
                </button>
                <button
                  type="button"
                  title="Italic (Ctrl+I)"
                  aria-label="Italic"
                  disabled={formattingDisabled}
                  onClick={() => handleFormat('italic')}
                  className={formatButtonClass}
                >
                  <TextItalic weight="bold" className="size-[15px]" />
                </button>
                <button
                  type="button"
                  title="Underline (Ctrl+U)"
                  aria-label="Underline"
                  disabled={formattingDisabled}
                  onClick={() => handleFormat('underline')}
                  className={formatButtonClass}
                >
                  <TextUnderline weight="bold" className="size-[15px]" />
                </button>
                <button
                  type="button"
                  title="Bulleted list"
                  aria-label="Bulleted list"
                  disabled={formattingDisabled}
                  onClick={() => handleFormat('bullet')}
                  className={formatButtonClass}
                >
                  <ListBullets weight="bold" className="size-[15px]" />
                </button>
                <button
                  type="button"
                  title="Numbered list"
                  aria-label="Numbered list"
                  disabled={formattingDisabled}
                  onClick={() => handleFormat('number')}
                  className={formatButtonClass}
                >
                  <ListNumbers weight="bold" className="size-[15px]" />
                </button>
                <button
                  type="button"
                  title="Code"
                  aria-label="Code"
                  disabled={formattingDisabled}
                  onClick={() => handleFormat('code')}
                  className={formatButtonClass}
                >
                  <Code weight="bold" className="size-[15px]" />
                </button>
                <button
                  type="button"
                  title="Link (Ctrl+K)"
                  aria-label="Link"
                  disabled={formattingDisabled}
                  onClick={() => handleFormat('link')}
                  className={formatButtonClass}
                >
                  <Link weight="bold" className="size-[15px]" />
                </button>
                <div className="w-[1px] h-[16px] bg-[#e9e9f3] mx-1" />
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              disabled={
                disabled || uploading || atFileLimit || !onFilesSelected
              }
              onChange={handleFileChange}
            />
            <button
              type="button"
              aria-label="Attach files"
              title={
                atFileLimit
                  ? `Maximum ${SUPPORT_MAX_ATTACHMENTS} files`
                  : 'Attach files'
              }
              disabled={
                disabled || uploading || atFileLimit || !onFilesSelected
              }
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center size-[26px] rounded-[6px] text-[#62647d] hover:text-[#15162c] hover:bg-[#f0f0fd] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Paperclip weight="bold" className="size-[15px]" />
            </button>
          </div>

          <button
            type="button"
            disabled={!canSend}
            onClick={() => {
              setIsPreview(false)
              onSend?.()
            }}
            aria-label={uploading ? 'Uploading attachments' : 'Send message'}
            className={cn(
              'flex items-center justify-center shrink-0 size-[32px] rounded-full transition-all duration-150',
              canSend
                ? 'text-white hover:scale-105 active:scale-95 cursor-pointer shadow-sm'
                : 'bg-[#f1f1f7] text-[#9496ab] cursor-not-allowed',
            )}
            style={canSend ? { background: gradientBg } : {}}
          >
            <PaperPlaneRight
              weight="fill"
              className="size-[14px] -translate-x-[1px] translate-y-[1px]"
            />
          </button>
        </div>
      </div>

      {uploadError ? (
        <p className="mt-2 text-[12px] text-red-600">{uploadError}</p>
      ) : null}
      {uploading ? (
        <p className="mt-2 text-[12px] text-[#62647d]">
          Uploading attachments…
        </p>
      ) : null}
    </div>
  )
}
