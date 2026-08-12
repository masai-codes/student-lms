import { useState } from 'react'
import {
  ArrowSquareOut,
  FilePdf,
  FileZip,
  FileText,
  FileCode,
  PlayCircle,
  Image,
  File,
  DownloadSimple,
  X,
} from '@phosphor-icons/react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const ext = pathname.split('.').pop()?.toLowerCase() ?? ''
    return ext
  } catch {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? ''
    return ext
  }
}

function getFileName(url: string, label?: string): string {
  if (label && label !== url) return label
  try {
    const pathname = new URL(url).pathname
    return decodeURIComponent(pathname.split('/').pop() ?? url)
  } catch {
    return url.split('/').pop() ?? url
  }
}

type AttachmentType =
  | 'image'
  | 'video'
  | 'pdf'
  | 'archive'
  | 'code'
  | 'text'
  | 'file'

function detectType(ext: string): AttachmentType {
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext))
    return 'image'
  if (['mp4', 'mov', 'webm', 'avi', 'mkv', 'flv', 'm4v'].includes(ext))
    return 'video'
  if (ext === 'pdf') return 'pdf'
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'archive'
  if (
    [
      'js',
      'ts',
      'tsx',
      'jsx',
      'py',
      'java',
      'c',
      'cpp',
      'rb',
      'go',
      'rs',
      'html',
      'css',
      'json',
      'xml',
      'yaml',
      'yml',
    ].includes(ext)
  )
    return 'code'
  if (
    ['txt', 'md', 'csv', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(
      ext,
    )
  )
    return 'text'
  return 'file'
}

// ─── Image card ─────────────────────────────────────────────────────────────

function ImageCard({
  url,
  label,
  variant,
}: {
  url: string
  label: string
  variant: 'user' | 'agent'
}) {
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState(false)

  if (error) {
    return (
      <FileCard
        url={url}
        label={label}
        icon={<Image className="size-4" weight="fill" />}
        typeLabel="Image"
        accentColor="#4b4396"
        variant={variant}
      />
    )
  }

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setExpanded(false)}
            aria-label="Close preview"
          >
            <X weight="bold" className="size-5" />
          </button>
          <img
            src={url}
            alt={label}
            className="max-w-full max-h-[90vh] rounded-[12px] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="mt-1.5 group relative">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`block w-full text-left rounded-[10px] overflow-hidden transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
            variant === 'user'
              ? 'ring-1 ring-white/20'
              : 'ring-1 ring-[#e9e9f3] dark:ring-border'
          }`}
          aria-label={`View image: ${label}`}
        >
          <img
            src={url}
            alt={label}
            onError={() => setError(true)}
            className="w-full object-cover bg-black/5"
            style={{ maxHeight: 200, borderRadius: 10 }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-all duration-200 rounded-[10px]">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11.5px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Image weight="fill" className="size-3.5" />
              Click to expand
            </div>
          </div>
        </button>
        {label && label !== url && (
          <p
            className={`mt-1 text-[11px] truncate ${variant === 'user' ? 'text-white/60' : 'text-[#9496ab] dark:text-foreground-subtle'}`}
          >
            {label}
          </p>
        )}
      </div>
    </>
  )
}

// ─── Video card ─────────────────────────────────────────────────────────────

function VideoCard({
  url,
  label,
  variant,
}: {
  url: string
  label: string
  variant: 'user' | 'agent'
}) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <div className="mt-1.5 rounded-[10px] overflow-hidden">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={url}
          controls
          autoPlay
          className="w-full rounded-[10px] bg-black"
          style={{ maxHeight: 220 }}
        />
      </div>
    )
  }

  return (
    <div
      className={`mt-1.5 flex items-center gap-3 p-3 rounded-[10px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group ${
        variant === 'user'
          ? 'bg-white/10 ring-1 ring-white/20 hover:bg-white/15'
          : 'bg-[#f1f1f7] dark:bg-muted ring-1 ring-[#e9e9f3] dark:ring-border hover:bg-[#e9e9f3] dark:hover:bg-accent'
      }`}
      onClick={() => setPlaying(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setPlaying(true)}
      aria-label={`Play video: ${label}`}
    >
      <div
        className={`flex items-center justify-center shrink-0 size-[44px] rounded-[10px] ${
          variant === 'user'
            ? 'bg-white/15'
            : 'bg-[#4b4396]/10 dark:bg-brand/15'
        }`}
      >
        <PlayCircle
          weight="fill"
          className={`size-[26px] group-hover:scale-110 transition-transform ${variant === 'user' ? 'text-white' : 'text-[#4b4396] dark:text-brand'}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-semibold truncate leading-snug ${variant === 'user' ? 'text-white' : 'text-[#15162c] dark:text-foreground'}`}
        >
          {label}
        </p>
        <p
          className={`text-[11px] mt-0.5 flex items-center gap-1 ${variant === 'user' ? 'text-white/60' : 'text-[#9496ab] dark:text-foreground-subtle'}`}
        >
          <span className="inline-block size-1.5 rounded-full bg-current" />
          Video · Tap to play
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`shrink-0 p-1.5 rounded-full transition-colors ${
          variant === 'user'
            ? 'text-white/60 hover:text-white hover:bg-white/10'
            : 'text-[#9496ab] dark:text-foreground-subtle hover:text-[#15162c] dark:hover:text-foreground hover:bg-[#e0e0ef] dark:hover:bg-white/10'
        }`}
        aria-label="Open in new tab"
      >
        <ArrowSquareOut weight="bold" className="size-3.5" />
      </a>
    </div>
  )
}

// ─── Generic file card ───────────────────────────────────────────────────────

function FileCard({
  url,
  label,
  icon,
  typeLabel,
  accentColor,
  variant,
}: {
  url: string
  label: string
  icon: React.ReactNode
  typeLabel: string
  accentColor: string
  variant: 'user' | 'agent'
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-1.5 flex items-center gap-3 p-3 rounded-[10px] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] no-underline group ${
        variant === 'user'
          ? 'bg-white/10 ring-1 ring-white/20 hover:bg-white/15'
          : 'bg-[#f1f1f7] dark:bg-muted ring-1 ring-[#e9e9f3] dark:ring-border hover:bg-[#e9e9f3] dark:hover:bg-accent'
      }`}
      aria-label={`Open ${label}`}
    >
      <div
        className="flex items-center justify-center shrink-0 size-[40px] rounded-[10px] text-white"
        style={{ backgroundColor: accentColor }}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-semibold truncate leading-snug ${variant === 'user' ? 'text-white' : 'text-[#15162c] dark:text-foreground'}`}
        >
          {label}
        </p>
        <p
          className={`text-[11px] mt-0.5 ${variant === 'user' ? 'text-white/60' : 'text-[#9496ab] dark:text-foreground-subtle'}`}
        >
          {typeLabel}
        </p>
      </div>

      <div
        className={`shrink-0 p-1.5 rounded-full transition-colors ${
          variant === 'user'
            ? 'text-white/60 group-hover:text-white'
            : 'text-[#9496ab] dark:text-foreground-subtle group-hover:text-[#15162c] dark:group-hover:text-foreground'
        }`}
      >
        <DownloadSimple weight="bold" className="size-4" />
      </div>
    </a>
  )
}

// ─── Public component ────────────────────────────────────────────────────────

export interface AttachmentCardProps {
  url: string
  label?: string
  variant?: 'user' | 'agent'
}

/**
 * AttachmentCard — renders a context-aware, beautiful card for any attachment.
 *
 * - Images → inline thumbnail with click-to-expand lightbox
 * - Videos → play-card that expands to inline player
 * - PDFs → red icon card with download button
 * - Archives → yellow icon card
 * - Code files → green icon card
 * - Text/Office → blue icon card
 * - Unknown → grey icon card
 *
 * Adapts colours to the `variant` (user = dark/purple bubble; agent = light bubble).
 */
export function AttachmentCard({
  url,
  label = '',
  variant = 'agent',
}: AttachmentCardProps) {
  const ext = getFileExtension(url)
  const type = detectType(ext)
  const displayLabel = getFileName(url, label)

  switch (type) {
    case 'image':
      return <ImageCard url={url} label={displayLabel} variant={variant} />

    case 'video':
      return <VideoCard url={url} label={displayLabel} variant={variant} />

    case 'pdf':
      return (
        <FileCard
          url={url}
          label={displayLabel}
          icon={<FilePdf weight="fill" className="size-4" />}
          typeLabel="PDF Document"
          accentColor="#e53935"
          variant={variant}
        />
      )

    case 'archive':
      return (
        <FileCard
          url={url}
          label={displayLabel}
          icon={<FileZip weight="fill" className="size-4" />}
          typeLabel="Archive"
          accentColor="#f59e0b"
          variant={variant}
        />
      )

    case 'code':
      return (
        <FileCard
          url={url}
          label={displayLabel}
          icon={<FileCode weight="fill" className="size-4" />}
          typeLabel={`${ext.toUpperCase()} File`}
          accentColor="#10b981"
          variant={variant}
        />
      )

    case 'text':
      return (
        <FileCard
          url={url}
          label={displayLabel}
          icon={<FileText weight="fill" className="size-4" />}
          typeLabel={`${ext.toUpperCase()} Document`}
          accentColor="#3b82f6"
          variant={variant}
        />
      )

    default:
      return (
        <FileCard
          url={url}
          label={displayLabel}
          icon={<File weight="fill" className="size-4" />}
          typeLabel="Attachment"
          accentColor="#6b7280"
          variant={variant}
        />
      )
  }
}
