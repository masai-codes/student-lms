import { useState } from 'react'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

import { MarkdownContent } from '@/components/shared/markdown-content'
import { markAnnouncementRead, markMessageRead } from '@/lib/api/announcement/announcementApi'

export function filterUnshownPopups(items: PopupItem[]): PopupItem[] {
  return items
}

interface Props {
  popups: PopupItem[]
  onDone: () => void
  onMarkedRead?: () => void
}

export function AnnouncementPopupModal({ popups, onDone, onMarkedRead }: Props) {
  const [index, setIndex] = useState(0)
  const [isMarking, setIsMarking] = useState(false)
  const queryClient = useQueryClient()

  const item = popups[index]
  if (!item) return null

  const hasCta = Boolean(item.ctaName && item.ctaLink)

  function advance() {
    const next = index + 1
    if (next >= popups.length) {
      onDone()
    } else {
      setIndex(next)
    }
  }

  async function handleMarkRead() {
    if (isMarking) return
    setIsMarking(true)
    try {
      if (item.source === 'a') {
        await markAnnouncementRead(Number(item.id))
      } else {
        await markMessageRead(Number(item.id))
      }
      queryClient.setQueryData<number>(
        ['announcement-unread-count'],
        (old = 0) => Math.max(0, old - 1),
      )
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      void queryClient.invalidateQueries({ queryKey: ['announcement-unread-count'] })
    } catch {
      // best-effort
    } finally {
      setIsMarking(false)
      onMarkedRead?.()
      advance()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-[18px] font-bold text-[#1C2B4B] font-poppins">
            {item.source === 'm' ? 'New message' : 'New announcement'}
          </h2>
          <button
            type="button"
            onClick={advance}
            className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors focus-visible:outline-none"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Body */}
        <div className="px-6 py-5 max-h-[50vh] overflow-y-auto text-sm text-gray-800">
          <MarkdownContent value={item.body} />
        </div>

        <div className="h-px bg-gray-200" />

        {/* Footer — CTA replaces Mark as read when present */}
        <div className="px-6 py-4">
          {hasCta ? (
            <a
              href={item.ctaLink!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void handleMarkRead()}
              className="flex w-full items-center justify-center rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none"
              style={{ background: '#6962AC', fontFamily: 'Poppins' }}
            >
              {item.ctaName!.length > 50 ? `${item.ctaName!.slice(0, 50)}…` : item.ctaName}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => void handleMarkRead()}
              disabled={isMarking}
              className="w-full rounded-lg border border-gray-200 py-3 text-sm font-medium text-[#1C2B4B] hover:bg-gray-50 transition-colors disabled:opacity-50 focus-visible:outline-none"
            >
              {isMarking ? 'Marking…' : 'Mark as read'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
