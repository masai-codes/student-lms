/**
 * useTicketComposer — stateful logic for creating and replying to a support
 * ticket. Drives TicketConversationPanel without any URL coupling so the panel
 * can be embedded anywhere (drawer, page, portal, …).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createSupportTicket,
  escalateSupportTicket,
  rateSupportTicket,
  replyToTicket,
  uploadSupportAttachment,
} from '@/lib/api/support/supportApi'
import { SUPPORT_KEYS, ticketThreadQuery } from '@/query/support/supportQueries'

const MAX_FILES = 5
const isImageName = (name: string) =>
  /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name)

export type UseTicketComposerParams = {
  batchId: string
  category?: string
  subcategory?: string
}

export function useTicketComposer({
  batchId,
  category,
  subcategory,
}: UseTicketComposerParams) {
  const queryClient = useQueryClient()
  const [ticketId, setTicketId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<Array<File>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingRating, setPendingRating] = useState<1 | 5 | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: thread } = useQuery({
    ...ticketThreadQuery(ticketId ?? 0),
    enabled: Boolean(ticketId),
  })

  const ticket = thread?.ticket
  const capabilities = thread?.capabilities
  const status = ticket?.status

  const refresh = useCallback(() => {
    if (ticketId)
      void queryClient.invalidateQueries({
        queryKey: SUPPORT_KEYS.thread(ticketId),
      })
    void queryClient.invalidateQueries({ queryKey: ['support', 'overview'] })
  }, [ticketId, queryClient])

  const createMutation = useMutation({
    mutationFn: (msg: string) =>
      createSupportTicket({
        batchId: Number(batchId),
        category: category ?? 'support',
        subCategory: subcategory ?? null,
        message: msg,
      }),
    onSuccess: ({ id }) => {
      setMessage('')
      setFiles([])
      void queryClient.invalidateQueries({ queryKey: ['support', 'overview'] })
      setTicketId(id)
    },
  })

  const replyMutation = useMutation({
    mutationFn: (msg: string) =>
      replyToTicket({ ticketId: ticketId!, message: msg }),
    onSuccess: () => {
      setMessage('')
      setFiles([])
      refresh()
    },
  })

  const rateMutation = useMutation({
    mutationFn: (rating: 1 | 5) =>
      rateSupportTicket({ ticketId: ticketId!, rating }),
    onSuccess: refresh,
    onSettled: () => setPendingRating(null),
  })

  const escalateMutation = useMutation({
    mutationFn: () => escalateSupportTicket(ticketId!),
    onSuccess: refresh,
  })

  const isExisting = Boolean(ticketId)
  const submitting =
    createMutation.isPending || replyMutation.isPending || uploading

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom, thread?.messages.length, ticket?.message])

  const handleSubmit = async () => {
    if ((!message.trim() && files.length === 0) || submitting) return
    setUploadError(null)

    let finalMessage = message.trim()
    if (files.length > 0) {
      setUploading(true)
      try {
        const uploaded = await Promise.all(
          files.map((f) => uploadSupportAttachment(f)),
        )
        const links = uploaded
          .map((u) =>
            isImageName(u.name)
              ? `![${u.name}](${u.url})`
              : `[${u.name}](${u.url})`,
          )
          .join('\n\n')
        finalMessage = finalMessage ? `${finalMessage}\n\n${links}` : links
      } catch {
        setUploading(false)
        setUploadError("Couldn't upload attachment. Please try again.")
        return
      }
      setUploading(false)
    }

    if (isExisting) replyMutation.mutate(finalMessage)
    else createMutation.mutate(finalMessage)
  }

  const handleRating = (value: 1 | 5) => {
    if (!ticketId || pendingRating !== null) return
    setPendingRating(value)
    rateMutation.mutate(value)
  }

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    setFiles((prev) => [...prev, ...Array.from(incoming)].slice(0, MAX_FILES))
  }

  const displayedRating =
    pendingRating !== null
      ? null
      : ticket?.rating === 1 || ticket?.rating === 5
        ? ticket.rating
        : null

  return {
    ticketId,
    thread,
    ticket,
    capabilities,
    status,
    message,
    setMessage,
    files,
    setFiles,
    uploading,
    uploadError,
    submitting,
    pendingRating,
    displayedRating,
    scrollRef,
    isExisting,
    handleSubmit,
    handleRating,
    addFiles,
    escalateMutation,
    MAX_FILES,
  }
}
