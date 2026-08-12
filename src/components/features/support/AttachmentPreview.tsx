/**
 * AttachmentPreview — rich attachment elements for chat messages.
 *
 * Images → compact thumbnail with a click-to-open lightbox overlay.
 * Videos → sleek "Play" chip that opens in a new tab.
 * Files  → icon + filename chip that opens in a new tab.
 */

import {
  ArrowSquareOut,
  FilePdf,
  FileText,
  FileZip,
  Image,
  Play,
  VideoCamera,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// ─── helpers ────────────────────────────────────────────────────────────────

const VIDEO_EXT = /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i
const PDF_EXT = /\.pdf$/i
const ZIP_EXT = /\.(zip|tar|gz|rar|7z)$/i

function getFileKind(
  name: string,
  srcUrl?: string,
): 'image' | 'video' | 'pdf' | 'zip' | 'file' {
  const target = name || srcUrl || ''
  if (IMAGE_EXT.test(target)) return 'image'
  if (VIDEO_EXT.test(target)) return 'video'
  if (PDF_EXT.test(target)) return 'pdf'
  if (ZIP_EXT.test(target)) return 'zip'
  return 'file'
}

function trimFilename(name: string, max = 32): string {
  if (name.length <= max) return name
  const ext = name.lastIndexOf('.')
  const extension = ext !== -1 ? name.slice(ext) : ''
  const base = ext !== -1 ? name.slice(0, ext) : name
  return `${base.slice(0, max - extension.length - 3)}…${extension}`
}

// ─── ImageThumbnail ──────────────────────────────────────────────────────────

export function ImageThumbnail({
  src,
  alt,
  variant = 'agent',
}: {
  src: string
  alt: string
  variant?: 'user' | 'agent'
}) {
  const isUser = variant === 'user'

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View image: ${alt}`}
      className={cn(
        'group relative mt-2 flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] text-left',
        isUser
          ? // Sits on the fixed dark-purple user bubble in BOTH modes, so the
            // tint must stay literal white (not the themed surface token).
            'bg-white/10 hover:bg-white/20 border border-white/20'
          : 'bg-surface hover:bg-surface-muted border border-[#e9e9f3] dark:border-border shadow-sm',
      )}
    >
      {/* Thumbnail icon area */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 size-[38px] rounded-[9px]',
          isUser ? 'bg-white/15' : 'bg-[#f0f0fd] dark:bg-brand-subtle',
        )}
      >
        <Image
          weight="duotone"
          className={cn(
            'size-[20px]',
            isUser ? 'text-white' : 'text-[#4b4396] dark:text-brand',
          )}
        />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[12.5px] font-semibold truncate leading-tight',
            isUser ? 'text-white' : 'text-[#15162c] dark:text-foreground',
          )}
        >
          {trimFilename(alt || 'Image')}
        </p>
        <p
          className={cn(
            'text-[11px] leading-tight mt-[2px]',
            isUser
              ? 'text-white/70'
              : 'text-[#62647d] dark:text-foreground-muted',
          )}
        >
          Click to open in new tab
        </p>
      </div>

      {/* Arrow icon */}
      <div
        className={cn(
          'shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser
            ? 'text-white/70'
            : 'text-[#9496ab] dark:text-foreground-subtle',
        )}
      >
        <ArrowSquareOut weight="bold" className="size-[14px]" />
      </div>
    </a>
  )
}

// ─── VideoChip ───────────────────────────────────────────────────────────────

export function VideoChip({
  href,
  name,
  variant = 'agent',
}: {
  href: string
  name: string
  variant?: 'user' | 'agent'
}) {
  const isUser = variant === 'user'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open video: ${name}`}
      className={cn(
        'group mt-2 flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]',
        isUser
          ? // Sits on the fixed dark-purple user bubble in BOTH modes, so the
            // tint must stay literal white (not the themed surface token).
            'bg-white/10 hover:bg-white/20 border border-white/20'
          : 'bg-surface hover:bg-surface-muted border border-[#e9e9f3] dark:border-border shadow-sm',
      )}
    >
      {/* Play icon container */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0 size-[38px] rounded-[9px] relative',
          isUser ? 'bg-white/15' : 'bg-[#f0f0fd] dark:bg-brand-subtle',
        )}
      >
        <VideoCamera
          weight="duotone"
          className={cn(
            'size-[18px]',
            isUser ? 'text-white' : 'text-[#4b4396] dark:text-brand',
          )}
        />
        {/* play badge */}
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 flex items-center justify-center size-[14px] rounded-full',
            isUser
              ? 'bg-white text-[#4b4396]'
              : 'bg-[#4b4396] text-white dark:bg-brand dark:text-brand-foreground',
          )}
        >
          <Play weight="fill" className="size-[7px]" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[12.5px] font-semibold truncate leading-tight',
            isUser ? 'text-white' : 'text-[#15162c] dark:text-foreground',
          )}
        >
          {trimFilename(name)}
        </p>
        <p
          className={cn(
            'text-[11px] leading-tight mt-[2px]',
            isUser
              ? 'text-white/70'
              : 'text-[#62647d] dark:text-foreground-muted',
          )}
        >
          Video · Click to play
        </p>
      </div>

      <ArrowSquareOut
        weight="bold"
        className={cn(
          'size-[14px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser
            ? 'text-white/70'
            : 'text-[#9496ab] dark:text-foreground-subtle',
        )}
      />
    </a>
  )
}

// ─── FileChip ────────────────────────────────────────────────────────────────

function FileIcon({
  kind,
  isUser,
}: {
  kind: 'pdf' | 'zip' | 'file'
  isUser: boolean
}) {
  const cls = cn(
    'size-[20px]',
    isUser ? 'text-white' : 'text-[#4b4396] dark:text-brand',
  )
  if (kind === 'pdf') return <FilePdf weight="duotone" className={cls} />
  if (kind === 'zip') return <FileZip weight="duotone" className={cls} />
  return <FileText weight="duotone" className={cls} />
}

function kindLabel(kind: 'pdf' | 'zip' | 'file'): string {
  if (kind === 'pdf') return 'PDF · Click to open'
  if (kind === 'zip') return 'Archive · Click to download'
  return 'File · Click to open'
}

export function FileChip({
  href,
  name,
  variant = 'agent',
}: {
  href: string
  name: string
  variant?: 'user' | 'agent'
}) {
  const isUser = variant === 'user'
  const kind = getFileKind(name, href) as 'pdf' | 'zip' | 'file'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open file: ${name}`}
      className={cn(
        'group mt-2 flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]',
        isUser
          ? // Sits on the fixed dark-purple user bubble in BOTH modes, so the
            // tint must stay literal white (not the themed surface token).
            'bg-white/10 hover:bg-white/20 border border-white/20'
          : 'bg-surface hover:bg-surface-muted border border-[#e9e9f3] dark:border-border shadow-sm',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center shrink-0 size-[38px] rounded-[9px]',
          isUser ? 'bg-white/15' : 'bg-[#f0f0fd] dark:bg-brand-subtle',
        )}
      >
        <FileIcon kind={kind} isUser={isUser} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[12.5px] font-semibold truncate leading-tight',
            isUser ? 'text-white' : 'text-[#15162c] dark:text-foreground',
          )}
        >
          {trimFilename(name)}
        </p>
        <p
          className={cn(
            'text-[11px] leading-tight mt-[2px]',
            isUser
              ? 'text-white/70'
              : 'text-[#62647d] dark:text-foreground-muted',
          )}
        >
          {kindLabel(kind)}
        </p>
      </div>

      <ArrowSquareOut
        weight="bold"
        className={cn(
          'size-[14px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser
            ? 'text-white/70'
            : 'text-[#9496ab] dark:text-foreground-subtle',
        )}
      />
    </a>
  )
}

// ─── SmartLink — detects kind and renders the right element ─────────────────

export function SmartLink({
  href,
  name,
  variant = 'agent',
}: {
  href: string
  name: string
  variant?: 'user' | 'agent'
}) {
  const kind = getFileKind(name, href)

  if (kind === 'video') {
    return <VideoChip href={href} name={name} variant={variant} />
  }
  if (kind === 'pdf' || kind === 'zip' || kind === 'file') {
    return <FileChip href={href} name={name} variant={variant} />
  }

  // Generic external link (e.g. https://…)
  const isUser = variant === 'user'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'font-medium underline underline-offset-2 hover:opacity-80 transition-opacity break-all text-[13.6px]',
        isUser ? 'text-white' : 'text-[#1264a3] dark:text-info',
      )}
    >
      {name}
    </a>
  )
}
