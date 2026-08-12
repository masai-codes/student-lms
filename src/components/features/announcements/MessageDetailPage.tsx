'use client'

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import MDEditor, { commands } from '@uiw/react-md-editor'
import {
  Paperclip,
  Send,
  ArrowLeft,
  Mic,
  MicOff,
  X,
  Play,
  Pause,
  Check,
} from 'lucide-react'
import type { AnnouncementDetail } from '@/server/api/announcement/getAnnouncementById.service'

import {
  markMessageRead,
  markMessageUnread,
} from '@/lib/api/announcement/announcementApi'
import { toast } from '@/lib/toast'
import { formatTimestampIST } from '@/utils/timeZoneHandler'
import { capitalize } from '@/utils/capitalize'
import { MarkdownContent } from '@/components/shared/markdown-content/MarkdownContent'
import { useInterviewRecorder } from '@/hooks/useInterviewRecorder'
import { useTheme } from '@/lib/theme'

interface MessageDetailPageProps {
  detail: AnnouncementDetail
}

interface UploadedFile {
  id: string
  name: string
  url: string
}

function SenderAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="size-9 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
      <span className="text-white text-sm font-semibold">{initial}</span>
    </div>
  )
}

async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/message/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  const data = (await res.json()) as { url: string; name: string }
  return { id: crypto.randomUUID(), name: file.name, url: data.url }
}

function isImageUrl(name: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name)
}

export function MessageDetailPage({ detail }: MessageDetailPageProps) {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const markedReadRef = useRef(false)

  const [isUnread, setIsUnread] = useState(false)
  const [replyValue, setReplyValue] = useState<string | undefined>('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const {
    state: recordingState,
    audioBlob,
    isPlaying: isWavePlaying,
    permissionDenied,
    waveformRef: waveSurferRef,
    startRecording,
    stopRecording,
    discardRecording,
    togglePlayback: toggleWavePlay,
  } = useInterviewRecorder()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // MDEditor themes itself off `data-color-mode`, outside our token system —
  // follow the app theme (same pattern as ui/markdown-composer.tsx).
  const { resolvedTheme, hydrated } = useTheme()

  // Message ids are BigInt — keep as a string to avoid Number precision loss.
  const messageId = detail.id
  const isValidId = /^\d+$/.test(messageId)
  const senderName = detail.from ?? detail.authorName
  const metaChips = [detail.category, detail.type]
    .filter(Boolean)
    .map(capitalize)

  // Auto-mark as read
  useEffect(() => {
    if (markedReadRef.current || !isValidId) return
    markedReadRef.current = true
    markMessageRead(messageId)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['announcements'] })
        if (!detail.isRead) {
          queryClient.setQueryData<number>(
            ['announcement-unread-count'],
            (old = 0) => Math.max(0, old - 1),
          )
        }
        void queryClient.invalidateQueries({
          queryKey: ['announcement-unread-count'],
        })
      })
      .catch(() => {})
  }, [messageId, queryClient, detail.isRead])

  useEffect(() => {
    if (permissionDenied) toast.error('Microphone access denied.')
  }, [permissionDenied])

  async function handleToggleUnread() {
    if (!isValidId) return
    try {
      if (isUnread) {
        await markMessageRead(messageId)
        setIsUnread(false)
        toast.success('Marked as read')
        queryClient.setQueryData<number>(
          ['announcement-unread-count'],
          (old = 0) => Math.max(0, old - 1),
        )
      } else {
        await markMessageUnread(messageId)
        setIsUnread(true)
        toast.success('Marked as unread')
        queryClient.setQueryData<number>(
          ['announcement-unread-count'],
          (old = 0) => old + 1,
        )
      }
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      void queryClient.invalidateQueries({
        queryKey: ['announcement-unread-count'],
      })
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  // ── File attachment ──────────────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setIsUploading(true)
    try {
      const results = await Promise.all(files.map(uploadFile))
      setUploadedFiles((prev) => [...prev, ...results])
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeFile(id: string) {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // ── Voice recording ──────────────────────────────────────────────────────────
  // Recording itself (record/stop/discard/playback) lives in useInterviewRecorder;
  // this component only owns what happens to the blob once recorded: upload it.

  async function saveRecording() {
    if (!audioBlob) return
    setIsUploading(true)
    try {
      const file = new File([audioBlob], 'voice_note.wav', {
        type: 'audio/wav',
      })
      const uploaded = await uploadFile(file)
      setUploadedFiles((prev) => [...prev, uploaded])
      discardRecording()
    } catch {
      toast.error('Failed to upload voice note.')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  async function handleSend() {
    let body = replyValue?.trim() ?? ''
    for (const f of uploadedFiles) {
      const md = isImageUrl(f.name)
        ? `\n\n![${f.name}](${f.url})`
        : `\n\n[${f.name}](${f.url})`
      body += md
    }
    if (!body.trim()) return

    try {
      const res = await fetch(`/api/message/${messageId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error('Send failed')
      toast.success('Message sent')
      setReplyValue('')
      setUploadedFiles([])
      await router.invalidate()
    } catch {
      toast.error('Failed to send message. Please try again.')
    }
  }

  return (
    <div className="flex flex-col bg-surface border border-border rounded-lg overflow-hidden mx-4 md:mx-8 my-4">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 py-3 flex items-center gap-3 border-b border-border">
        <button
          type="button"
          onClick={() =>
            void navigate({ to: '/announcements', search: { page: 1 } })
          }
          className="text-foreground-muted hover:text-foreground transition-colors p-1 -ml-1"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <SenderAvatar name={senderName} />

        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-foreground leading-tight truncate">
            {senderName}
          </p>
          {metaChips.length > 0 && (
            <p className="text-sm text-foreground-muted leading-tight">
              {metaChips.map((chip) => (
                <span key={chip} className="mr-3">
                  • {chip}
                </span>
              ))}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleToggleUnread()}
          className="shrink-0 px-4 py-1.5 rounded-md border border-border-strong text-sm font-medium text-foreground bg-surface hover:bg-surface-muted transition-colors focus-visible:outline-none whitespace-nowrap"
        >
          {isUnread ? 'Mark As Read' : 'Mark As Unread'}
        </button>
      </div>

      {/* ── Message thread ──────────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex flex-col gap-4 w-full">
        {/* Title pill */}
        <div className="flex justify-center">
          <span className="px-4 py-1 rounded-md bg-surface-muted text-foreground text-sm font-medium">
            {detail.title}
          </span>
        </div>

        {/* CTA button */}
        {detail.ctaName && detail.ctaLink && (
          <a
            href={detail.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-brand-foreground bg-brand transition-opacity hover:opacity-90"
          >
            {detail.ctaName.length > 50
              ? `${detail.ctaName.slice(0, 50)}…`
              : detail.ctaName}
          </a>
        )}

        {/* Thread bubbles */}
        {detail.thread.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[520px] ${msg.isSentByUser ? 'self-end' : 'self-start'}`}
          >
            <div
              className={`px-4 py-3 ${
                msg.isSentByUser
                  ? 'rounded-2xl rounded-tr-sm bg-brand-subtle border border-brand-subtle'
                  : 'rounded-2xl rounded-tl-sm bg-[#FEFCE8] border border-yellow-100 dark:bg-warning-subtle dark:border-warning-subtle'
              }`}
            >
              <MarkdownContent value={msg.body} />
              <p className="mt-2 text-[11px] text-foreground-subtle text-right">
                {formatTimestampIST(msg.scheduledAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Reply area ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 border-t border-border px-4 md:px-6 py-4 bg-surface flex flex-col gap-3"
        data-color-mode={hydrated ? resolvedTheme : 'light'}
      >
        {/* Recording UI */}
        {/* Markdown editor — always visible */}
        <div className="border border-border rounded-lg overflow-hidden">
          <MDEditor
            value={replyValue}
            onChange={setReplyValue}
            preview="edit"
            height={160}
            visibleDragbar={false}
            textareaProps={{ placeholder: 'Type message here' }}
            style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}
            commands={[
              commands.bold,
              commands.italic,
              commands.strikethrough,
              commands.link,
              commands.orderedListCommand,
              commands.unorderedListCommand,
              commands.code,
              commands.codeBlock,
              commands.image,
            ]}
          />
        </div>

        {/* Uploaded files stack */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {uploadedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-info-subtle bg-info-subtle text-sm text-info-subtle-foreground max-w-sm"
              >
                <span className="truncate flex-1">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="shrink-0 text-info hover:text-info-subtle-foreground transition-colors"
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-2">
          {/* Spacer */}
          <div className="flex-1" />

          {/* Recorded state: waveform + controls */}
          {recordingState === 'recorded' && (
            <>
              <div
                ref={waveSurferRef}
                className="w-[200px] h-[44px] border border-info-subtle rounded-lg bg-info-subtle overflow-hidden shrink-0"
              />
              <button
                type="button"
                onClick={toggleWavePlay}
                className="flex items-center justify-center size-10 rounded-lg bg-[#1C3BAA] text-white hover:bg-[#1a35a0] transition-colors shrink-0"
                aria-label={isWavePlaying ? 'Pause' : 'Play'}
              >
                {isWavePlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <button
                type="button"
                onClick={() => void saveRecording()}
                disabled={isUploading}
                className="flex items-center justify-center size-10 rounded-lg bg-[#1C3BAA] text-white hover:bg-[#1a35a0] transition-colors disabled:opacity-50 shrink-0"
                aria-label="Save recording"
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                onClick={discardRecording}
                className="flex items-center justify-center size-10 rounded-lg bg-danger text-danger-foreground hover:bg-danger transition-colors shrink-0"
                aria-label="Discard recording"
              >
                <X size={18} />
              </button>
            </>
          )}

          {/* Recording state: mic (active) + indicator */}
          {recordingState === 'recording' && (
            <>
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center justify-center size-10 rounded-lg bg-[#1C3BAA] text-white animate-pulse shrink-0"
                aria-label="Stop recording"
              >
                <Mic size={18} />
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <span className="size-2 rounded-full bg-danger animate-pulse" />
                <span className="text-sm font-medium text-danger">
                  Recording...
                </span>
              </div>
            </>
          )}

          {/* Idle state: mic-off button */}
          {recordingState === 'idle' && (
            <button
              type="button"
              onClick={() => void startRecording()}
              className="flex items-center justify-center size-10 rounded-lg bg-[#1C3BAA] text-white hover:bg-[#1a35a0] transition-colors shrink-0"
              aria-label="Start voice recording"
            >
              <MicOff size={18} />
            </button>
          )}

          {/* Attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center size-10 rounded-lg border border-border text-brand bg-surface hover:bg-surface-muted transition-colors disabled:opacity-50 shrink-0"
            aria-label="Attach file"
          >
            {isUploading ? (
              <span className="size-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip size={18} />
            )}
          </button>

          {/* Send */}
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!replyValue?.trim() && !audioBlob}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#3D4A6B] text-white text-sm font-semibold hover:bg-[#333f5c] transition-colors focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            SEND <Send size={14} />
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void handleFileSelect(e)}
      />
    </div>
  )
}
