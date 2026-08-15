import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type PointerEvent,
} from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { CalendarCheck, Lifebuoy, Ticket } from '@phosphor-icons/react'
import type {
  FloatingChatInbox,
  TicketListItem,
} from '@/server/api/support/support.types'
import {
  SUPPORT_KEYS,
  supportSubcategoriesQuery,
  supportEntityContextQuery,
  ticketThreadQuery,
} from '@/query/support/supportQueries'
import { learnPageQuery } from '@/query/learn/learnQueries'
import { isResolvedTicketStatus } from './ticketStatus'
import {
  mapLearningItemToSupportItem,
  supportCategoryToLearnFilters,
  supportCategoryToLearningType,
  supportCategoryUsesLearnApi,
} from './supportCategoryLearning'
import { mapSupportCategoryToTicketCategory } from './ticketCategoryMapping'
import { ApiClientError } from '@/lib/api/apiClientError'

import { CATEGORIES } from './mockData'
import type { Item, Message, TicketFilter, FloatingChatView } from './types'
import { ENABLE_SUPPORT_AI_REPLY_CARD } from './supportAiFlags'

import { FloatingChatHeader } from './FloatingChatHeader'
import { CourseSelector } from './CourseSelector'
import { CategorySelector } from './CategorySelector'
import { ItemSelector } from './ItemSelector'
import { ItemConfirmation } from './ItemConfirmation'
import { ChatThread } from './ChatThread'
import { TicketList } from './TicketList'
import { ChatComposer } from './ChatComposer'
import { CallbackReasonSelector } from './CallbackReasonSelector'
import { CallbackTimeSelector } from './CallbackTimeSelector'
import { CallbackStatus } from './CallbackStatus'
import {
  filterCallbackReasons,
  hasPendingCallbackForBatch,
} from './callbackHelpers'
import { ResolvedTicketFeedback } from './ResolvedTicketFeedback'
import { FloatingOneOnOneTab } from './FloatingOneOnOneTab'
import { QuickQuerySelector } from './QuickQuerySelector'
import {
  createSupportTicket,
  createSupportCallback,
  rateSupportTicket,
  reopenSupportTicket,
  escalateSupportTicket,
  replyToTicket,
  uploadSupportAttachment,
} from '@/lib/api/support/supportApi'
import {
  embedSupportAttachmentLinks,
  SUPPORT_MAX_ATTACHMENTS,
} from './supportAttachmentUpload'
import { EntityLaunchErrorPanel } from './EntityLaunchErrorPanel'
import { getEntityLaunchErrorMessage } from './entityLaunchErrorMessage'
import type { FloatingChatEntityLaunchIntent } from './floatingChatLaunchIntent'
import { floatingChatEntityLaunchKey } from './floatingChatLaunchIntent'
import type { SupportReviewItemInput } from './supportReviewItem'

interface FloatingChatModalProps {
  isOpen: boolean
  onClose?: () => void
  inbox?: FloatingChatInbox
  isInboxLoading: boolean
  isInboxError: boolean
  onInboxRetry: () => void
  onReviewItem?: (input: SupportReviewItemInput) => void
  /** Full viewport page (e.g. `/support`) vs anchored floater panel. */
  presentation?: 'floating' | 'fullPage'
  /** Deep-link from a learn detail page → step 2.5 for this entity. */
  entityLaunchIntent?: FloatingChatEntityLaunchIntent | null
  onEntityLaunchComplete?: () => void
  onEntityLaunchFailed?: () => void
}

const SUPPORT_ITEM_PAGE_SIZE = 10

function threadMessagesToChat(
  messages: Array<{
    message: string
    side: string
    author: { name: string }
    createdAt?: string | null
    isAi?: boolean
  }>,
): Message[] {
  return messages.map((m) => ({
    role: m.side === 'student' ? 'user' : m.side === 'system' ? 'bot' : 'agent',
    text: m.message,
    name:
      m.side === 'agent' && !(ENABLE_SUPPORT_AI_REPLY_CARD && m.isAi)
        ? m.author.name
        : undefined,
    isAutoReply: m.side === 'system',
    isAi: ENABLE_SUPPORT_AI_REPLY_CARD && m.isAi === true,
    createdAt: m.createdAt ?? null,
  }))
}

/**
 * Build the full conversation for ChatThread. The student's opening text lives
 * on `ticket.message` (not as a comment) — same shape as CreateTicketModal —
 * so it must be prepended ahead of the public comment thread.
 */
function buildChatThreadMessages(thread: {
  ticket: { message: string; createdAt?: string | null }
  messages: Array<{
    message: string
    side: string
    author: { name: string }
    createdAt?: string | null
  }>
}): Message[] {
  const opening = thread.ticket.message.trim()
  const comments = threadMessagesToChat(thread.messages)
  if (!opening) return comments
  return [
    { role: 'user', text: opening, createdAt: thread.ticket.createdAt ?? null },
    ...comments,
  ]
}

function isFloatingChatSelectOpen(): boolean {
  return Boolean(
    document.querySelector('[data-slot="select-content"][data-state="open"]'),
  )
}

export function FloatingChatModal({
  isOpen,
  onClose,
  inbox,
  isInboxLoading,
  isInboxError,
  onInboxRetry,
  onReviewItem,
  presentation = 'floating',
  entityLaunchIntent = null,
  onEntityLaunchComplete,
  onEntityLaunchFailed,
}: FloatingChatModalProps) {
  const isFullPage = presentation === 'fullPage'
  // Full-page support (`/support`) and iframe embeds use the host app's navigation
  // — no in-panel close control. The floating drawer keeps a mobile-only X.
  const [isEmbedded] = useState(
    () => typeof window !== 'undefined' && window.self !== window.top,
  )
  const appliedEntityLaunchRef = useRef<string | null>(null)
  const queryClient = useQueryClient()
  const threadScrollRef = useRef<HTMLDivElement>(null)

  const [view, setView] = useState<FloatingChatView>('home')
  const [step, setStep] = useState(0)
  /** Step to return to when backing out of the composer (step 3). */
  const [composerReturnStep, setComposerReturnStep] = useState(2.8)

  const goToComposer = (returnStep: number) => {
    setComposerReturnStep(returnStep)
    setStep(3)
  }

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [itemSearch, setItemSearch] = useState('')
  const [debouncedItemSearch, setDebouncedItemSearch] = useState('')
  const [itemPage, setItemPage] = useState(1)

  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('all')
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  )
  const [selectedSubCategoryLabel, setSelectedSubCategoryLabel] = useState<
    string | null
  >(null)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<Array<File>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [entityLaunchError, setEntityLaunchError] = useState<string | null>(
    null,
  )

  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false)
  const [callbackStatus, setCallbackStatus] = useState<
    'success' | 'already_requested'
  >('success')
  const [selectedCallbackReason, setSelectedCallbackReason] = useState<
    string | null
  >(null)
  const [selectedCallbackTimeslot, setSelectedCallbackTimeslot] = useState<
    string | null
  >(null)
  const [isEscalating, setIsEscalating] = useState(false)

  const batches = inbox?.batches ?? []
  const tickets = inbox?.tickets ?? []
  const callbackTickets = inbox?.callbackTickets ?? []
  const openTicketCount = inbox?.openTicketCount ?? 0
  const callbackOptions = inbox?.callback ?? { reasons: [], timeslots: [] }
  const fullFeesPaidBatchIds = inbox?.fullFeesPaidBatchIds ?? []
  const batchContacts = inbox?.batchContacts ?? {}
  const oneOnOneGroups = inbox?.oneOnOne ?? []
  const hasOneOnOne = oneOnOneGroups.length > 0
  const showBatchStep = batches.length > 1
  const pendingEntityLaunchKey = entityLaunchIntent
    ? floatingChatEntityLaunchKey(entityLaunchIntent)
    : null
  const isApplyingEntityLaunch =
    pendingEntityLaunchKey != null &&
    isOpen &&
    appliedEntityLaunchRef.current !== pendingEntityLaunchKey

  useEffect(() => {
    setIsEscalating(false)
  }, [selectedTicketId])

  useEffect(() => {
    if (entityLaunchIntent) return
    if (batches.length !== 1) return
    setSelectedBatchId(batches[0].id)
    setStep((current) => (current === 0 ? 1 : current))
  }, [batches, entityLaunchIntent])

  const {
    data: entityContext,
    isLoading: isEntityContextLoading,
    isError: isEntityContextError,
    error: entityContextError,
    refetch: refetchEntityContext,
  } = useQuery({
    ...supportEntityContextQuery(
      entityLaunchIntent?.category ?? '',
      entityLaunchIntent?.entityId ?? 0,
    ),
    enabled:
      entityLaunchIntent != null && isOpen && !isInboxLoading && inbox != null,
  })

  useEffect(() => {
    if (!entityLaunchIntent || !isOpen || !inbox) return

    const launchKey = floatingChatEntityLaunchKey(entityLaunchIntent)
    if (appliedEntityLaunchRef.current === launchKey) return
    if (isEntityContextLoading) return

    if (isEntityContextError || !entityContext) {
      appliedEntityLaunchRef.current = launchKey
      setEntityLaunchError(
        getEntityLaunchErrorMessage({
          error: entityContextError,
          category: entityLaunchIntent.category,
          entityId: entityLaunchIntent.entityId,
        }),
      )
      return
    }

    const batchKnown = batches.some(
      (batch) => batch.id === entityContext.batchId,
    )
    if (!batchKnown) {
      appliedEntityLaunchRef.current = launchKey
      setEntityLaunchError(
        getEntityLaunchErrorMessage({
          reason: 'batch_unknown',
          category: entityLaunchIntent.category,
          entityId: entityLaunchIntent.entityId,
        }),
      )
      return
    }

    setEntityLaunchError(null)
    setView('home')
    setSelectedBatchId(entityContext.batchId)
    setSelectedCategory(entityContext.category)
    setSelectedItem(entityContext.item)
    if (entityContext.lectureSnapshot != null) {
      queryClient.setQueryData(
        SUPPORT_KEYS.lectureSnapshot(entityContext.lectureSnapshot.lectureId),
        entityContext.lectureSnapshot,
      )
    }
    setSelectedSubCategory(null)
    setSelectedSubCategoryLabel(null)
    setMessage('')
    setFiles([])
    setUploadError(null)
    setStep(2.5)
    appliedEntityLaunchRef.current = launchKey
    onEntityLaunchComplete?.()
  }, [
    entityLaunchIntent,
    isOpen,
    inbox,
    isEntityContextLoading,
    isEntityContextError,
    entityContextError,
    entityContext,
    batches,
    onEntityLaunchComplete,
    queryClient,
  ])

  useEffect(() => {
    if (entityLaunchIntent) return
    appliedEntityLaunchRef.current = null
    setEntityLaunchError(null)
  }, [entityLaunchIntent])

  const handleBatchSelect = (batchId: number) => {
    setSelectedBatchId(batchId)
    setStep(1)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedItemSearch(itemSearch), 300)
    return () => clearTimeout(timer)
  }, [itemSearch])

  const [lectureTypeFilter, setLectureTypeFilter] = useState<string>('any')
  const [attendanceStatusFilter, setAttendanceStatusFilter] =
    useState<string>('any')
  const [assignmentPriorityFilter, setAssignmentPriorityFilter] =
    useState<string>('any')
  const [assignmentCategoryFilter, setAssignmentCategoryFilter] =
    useState<string>('any')
  const [assignmentModuleFilter, setAssignmentModuleFilter] =
    useState<string>('any')
  const [evaluationProgressFilter, setEvaluationProgressFilter] =
    useState<string>('any')
  const [evaluationModuleFilter, setEvaluationModuleFilter] =
    useState<string>('any')

  useEffect(() => {
    setItemPage(1)
  }, [
    debouncedItemSearch,
    selectedCategory,
    lectureTypeFilter,
    attendanceStatusFilter,
    assignmentPriorityFilter,
    assignmentCategoryFilter,
    assignmentModuleFilter,
    evaluationProgressFilter,
    evaluationModuleFilter,
  ])

  const usesLearnApi =
    selectedCategory != null && supportCategoryUsesLearnApi(selectedCategory)
  const learningType = selectedCategory
    ? supportCategoryToLearningType(selectedCategory)
    : null
  const learnFilters = selectedCategory
    ? supportCategoryToLearnFilters(selectedCategory, {
        lectureType: lectureTypeFilter,
        attendanceStatus: attendanceStatusFilter,
        assignmentPriority: assignmentPriorityFilter,
        assignmentCategory: assignmentCategoryFilter,
        assignmentModule: assignmentModuleFilter,
        evaluationProgress: evaluationProgressFilter,
        evaluationModule: evaluationModuleFilter,
      })
    : undefined

  const {
    data: learnPageData,
    isLoading: isLearnItemsLoading,
    isFetching: isLearnItemsFetching,
    isError: isLearnItemsError,
    refetch: refetchLearnItems,
  } = useQuery({
    ...learnPageQuery({
      batchId: selectedBatchId!,
      learningType: learningType!,
      search: debouncedItemSearch.trim() || undefined,
      page: itemPage,
      pageSize: SUPPORT_ITEM_PAGE_SIZE,
      filters: learnFilters,
    }),
    enabled:
      view === 'home' &&
      step === 2 &&
      usesLearnApi &&
      selectedBatchId != null &&
      learningType != null,
    placeholderData: keepPreviousData,
  })

  const subcategoryCategory =
    selectedCategory && supportCategoryUsesLearnApi(selectedCategory)
      ? selectedCategory
      : null

  const {
    data: subcategoriesData,
    isLoading: isSubcategoriesLoading,
    isError: isSubcategoriesError,
    refetch: refetchSubcategories,
  } = useQuery({
    ...supportSubcategoriesQuery(subcategoryCategory ?? ''),
    enabled:
      subcategoryCategory != null &&
      view === 'home' &&
      (step === 2.5 || step === 2.8),
  })

  const subcategoryOptions = subcategoriesData?.subcategories ?? []

  const { data: ticketThread, isLoading: isThreadLoading } = useQuery({
    ...ticketThreadQuery(selectedTicketId ?? 0),
    enabled: view === 'tickets' && selectedTicketId != null,
  })

  const refreshAfterMutation = (ticketId: number) => {
    void queryClient.invalidateQueries({
      queryKey: SUPPORT_KEYS.floatingChatInbox,
    })
    void queryClient.invalidateQueries({
      queryKey: SUPPORT_KEYS.thread(ticketId),
    })
  }

  const resetHomeFlow = () => {
    setSelectedCategory(null)
    setSelectedItem(null)
    setItemSearch('')
    setDebouncedItemSearch('')
    setItemPage(1)
    setLectureTypeFilter('any')
    setAttendanceStatusFilter('any')
    setAssignmentPriorityFilter('any')
    setAssignmentCategoryFilter('any')
    setAssignmentModuleFilter('any')
    setEvaluationProgressFilter('any')
    setEvaluationModuleFilter('any')
    setComposerReturnStep(2.8)
    setSelectedCallbackReason(null)
    setSelectedCallbackTimeslot(null)
    // Keep the chosen batch; only rewind the wizard to category selection.
    setStep(selectedBatchId != null ? 1 : showBatchStep ? 0 : 1)
  }

  const createTicketMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: ({ id }) => {
      refreshAfterMutation(id)
      setMessage('')
      setFiles([])
      setSelectedSubCategory(null)
      setSelectedSubCategoryLabel(null)
      resetHomeFlow()
      setView('tickets')
      setSelectedTicketId(id)
    },
    onError: () =>
      setUploadError('Couldn’t send your message. Please try again.'),
  })

  const replyMutation = useMutation({
    mutationFn: replyToTicket,
    onSuccess: () => {
      if (selectedTicketId) refreshAfterMutation(selectedTicketId)
      setMessage('')
      setFiles([])
    },
    onError: () =>
      setUploadError('Couldn’t send your reply. Please try again.'),
  })

  const callbackMutation = useMutation({
    mutationFn: createSupportCallback,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SUPPORT_KEYS.floatingChatInbox,
      })
      setCallbackStatus('success')
      setStep(6)
    },
    onError: (error) => {
      if (
        error instanceof ApiClientError &&
        error.code === 'SUPPORT_CALLBACK_DUPLICATE'
      ) {
        setCallbackStatus('already_requested')
        setStep(6)
        return
      }
      setUploadError('Couldn’t request a callback. Please try again.')
    },
    onSettled: () => setIsSubmittingCallback(false),
  })

  const rateTicketMutation = useMutation({
    mutationFn: (input: {
      ticketId: number
      rating: 1 | 5
      reasons?: string[]
      comment?: string
    }) => rateSupportTicket(input),
    onSuccess: (_data, { ticketId }) => refreshAfterMutation(ticketId),
  })

  const reopenTicketMutation = useMutation({
    mutationFn: (ticketId: number) => reopenSupportTicket(ticketId),
    onSuccess: (_data, ticketId) => refreshAfterMutation(ticketId),
  })

  const escalateTicketMutation = useMutation({
    mutationFn: (ticketId: number) => escalateSupportTicket(ticketId),
    onSuccess: (_data, ticketId) => refreshAfterMutation(ticketId),
  })

  const selectedBatch = batches.find((b) => b.id === selectedBatchId)
  const hasFullFees =
    selectedBatchId != null && fullFeesPaidBatchIds.includes(selectedBatchId)
  const callbackReasons = useMemo(
    () => filterCallbackReasons(callbackOptions.reasons, hasFullFees),
    [callbackOptions.reasons, hasFullFees],
  )
  const callbackTimeslots = useMemo(
    () => callbackOptions.timeslots.map((slot) => slot.value),
    [callbackOptions.timeslots],
  )
  const callbackContact =
    selectedBatchId != null ? (batchContacts[selectedBatchId] ?? null) : null
  const hasPendingCallback =
    selectedBatchId != null &&
    hasPendingCallbackForBatch(callbackTickets, selectedBatchId)
  const selectedCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory)
  const selectedItemObj = selectedItem
  const selectedTicket: TicketListItem | undefined = tickets.find(
    (t) => t.id === selectedTicketId,
  )
  const threadMessages = ticketThread
    ? buildChatThreadMessages(ticketThread)
    : []

  const scrollThreadToBottom = useCallback(() => {
    const el = threadScrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  // Keep the latest reply (and the full thread on open) in view —
  // same pattern as CreateTicketModal.
  useEffect(() => {
    if (view !== 'tickets' || selectedTicketId == null || isThreadLoading)
      return
    if (threadMessages.length === 0) return
    requestAnimationFrame(() => scrollThreadToBottom())
  }, [
    view,
    selectedTicketId,
    isThreadLoading,
    threadMessages.length,
    scrollThreadToBottom,
  ])

  const learnItems = useMemo(
    () =>
      (learnPageData?.learningItems ?? []).map(mapLearningItemToSupportItem),
    [learnPageData?.learningItems],
  )
  const selectorItems = learnItems

  const goToHomeStart = () => {
    setSelectedCallbackReason(null)
    setSelectedCallbackTimeslot(null)
    setStep(showBatchStep ? 0 : 1)
  }

  const startCallbackFlow = () => {
    setSelectedCallbackReason(null)
    setSelectedCallbackTimeslot(null)
    setUploadError(null)
    if (hasPendingCallback) {
      setCallbackStatus('already_requested')
      setStep(6)
      return
    }
    setStep(4)
  }

  const handleCallbackReasonSelect = (reason: string) => {
    setSelectedCallbackReason(reason)
    setStep(5)
  }

  const handleCallbackTimeslotSubmit = (timeslot: string) => {
    if (!selectedBatchId || !selectedCallbackReason || isSubmittingCallback)
      return
    setSelectedCallbackTimeslot(timeslot)
    setIsSubmittingCallback(true)
    callbackMutation.mutate({
      batchId: selectedBatchId,
      category: selectedCallbackReason,
      preferredTimeSlot: timeslot,
    })
  }

  const handleBack = () => {
    if (view === 'tickets') {
      if (selectedTicketId) setSelectedTicketId(null)
      return
    }
    if (step === 6) {
      goToHomeStart()
    } else if (step === 5) {
      setStep(4)
    } else if (step === 4) {
      setStep(1)
    } else if (step === 3) {
      setStep(composerReturnStep)
    } else if (step === 2.8) {
      setStep(2.5)
    } else if (step === 2.5) {
      setStep(2)
    } else if (step === 2) {
      setSelectedItem(null)
      setItemSearch('')
      setDebouncedItemSearch('')
      setItemPage(1)
      setStep(1)
    } else if (step === 1 && showBatchStep) {
      setStep(0)
    }
  }

  const handleSwitchTab = (newView: FloatingChatView) => {
    setView(newView)
    setSelectedTicketId(null)
    if (newView === 'home') {
      resetHomeFlow()
    }
    // Draft state belongs to whichever flow is active — leaving it behind would
    // leak a half-typed "create" draft (topic chip, message) into a reply box.
    setSelectedSubCategory(null)
    setSelectedSubCategoryLabel(null)
    setMessage('')
    setFiles([])
    setUploadError(null)
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedItem(null)
    setItemSearch('')
    setDebouncedItemSearch('')
    setItemPage(1)
    setLectureTypeFilter('any')
    setAttendanceStatusFilter('any')
    setAssignmentPriorityFilter('any')
    setAssignmentCategoryFilter('any')
    setAssignmentModuleFilter('any')
    setEvaluationProgressFilter('any')
    setEvaluationModuleFilter('any')
    if (categoryId === 'general') {
      goToComposer(1)
    } else {
      setStep(2)
    }
  }

  const addFiles = (incoming: Array<File>) => {
    setUploadError(null)
    setFiles((prev) => [...prev, ...incoming].slice(0, SUPPORT_MAX_ATTACHMENTS))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const isCreatingTicket = view === 'home' && step === 3
  const isSubmitting =
    uploading || createTicketMutation.isPending || replyMutation.isPending

  const handleComposerSend = async () => {
    if (
      (!selectedSubCategory && !message.trim() && files.length === 0) ||
      isSubmitting
    )
      return
    setUploadError(null)

    // The quick-question chip ("Topic:") shows the label; the slug is stored as subCategory.
    const extraText = message.trim()
    const topicText = selectedSubCategoryLabel ?? selectedSubCategory
    let finalMessage = topicText
      ? extraText
        ? `${topicText}\n\n${extraText}`
        : topicText
      : extraText

    if (files.length > 0) {
      setUploading(true)
      try {
        const uploaded = await Promise.all(
          files.map((f) => uploadSupportAttachment(f)),
        )
        finalMessage = embedSupportAttachmentLinks(finalMessage, uploaded)
      } catch {
        setUploading(false)
        setUploadError('Couldn’t upload your attachment. Please try again.')
        return
      }
      setUploading(false)
    }

    if (isCreatingTicket) {
      if (!selectedBatchId) {
        setUploadError('Select a course before raising a ticket.')
        return
      }
      createTicketMutation.mutate({
        batchId: selectedBatchId,
        category: mapSupportCategoryToTicketCategory(
          selectedCategoryObj?.id ?? 'general',
        ),
        subCategory: selectedSubCategory,
        message: finalMessage,
        entityId: selectedItem?.id ?? null,
        // Same underlying widget powers both the anchored floater and the
        // `/support` full-page experience — both origins should be logged.
        fromFloater: true,
      })
    } else if (view === 'tickets' && selectedTicketId) {
      replyMutation.mutate({
        ticketId: selectedTicketId,
        message: finalMessage,
      })
    }
  }

  const isTicketResolved =
    selectedTicket != null && isResolvedTicketStatus(selectedTicket.status)
  const ticketRating =
    ticketThread?.ticket.rating ?? selectedTicket?.rating ?? 0
  const hasSubmittedRating = ticketRating === 1 || ticketRating === 5
  const canRateResolvedTicket = ticketThread?.capabilities?.canRate ?? false
  const showResolvedFeedback =
    view === 'tickets' &&
    selectedTicketId != null &&
    isTicketResolved &&
    !isEscalating &&
    canRateResolvedTicket
  const isFeedbackSubmitting =
    rateTicketMutation.isPending ||
    reopenTicketMutation.isPending ||
    escalateTicketMutation.isPending

  const handleSubmitTicketRating = async (input: {
    rating: 1 | 5
    reasons: string[]
    comment: string
  }) => {
    if (!selectedTicketId) return
    await rateTicketMutation.mutateAsync({
      ticketId: selectedTicketId,
      rating: input.rating,
      reasons: input.reasons,
      comment: input.comment,
    })
  }

  const handleReopenEscalateTicket = async (input: {
    reasons: string[]
    comment: string
  }) => {
    if (!selectedTicketId) return
    await rateTicketMutation.mutateAsync({
      ticketId: selectedTicketId,
      rating: 1,
      reasons: input.reasons,
      comment: input.comment,
    })
    if (ticketThread?.capabilities?.canEscalate) {
      await escalateTicketMutation.mutateAsync(selectedTicketId)
    } else {
      await reopenTicketMutation.mutateAsync(selectedTicketId)
    }
    setIsEscalating(true)
  }

  const showInboxLoading = isInboxLoading && !inbox
  const showEntityLaunchError = entityLaunchError != null

  const handleEntityLaunchRetry = () => {
    if (!entityLaunchIntent) return
    appliedEntityLaunchRef.current = null
    setEntityLaunchError(null)
    void queryClient
      .resetQueries({
        queryKey: SUPPORT_KEYS.entityContext(
          entityLaunchIntent.category,
          entityLaunchIntent.entityId,
        ),
      })
      .then(() => refetchEntityContext())
  }

  const handleEntityLaunchDismiss = () => {
    setEntityLaunchError(null)
    if (entityLaunchIntent) {
      appliedEntityLaunchRef.current =
        floatingChatEntityLaunchKey(entityLaunchIntent)
    }
    setView('home')
    setSelectedCategory(null)
    setSelectedItem(null)
    setSelectedSubCategory(null)
    setSelectedSubCategoryLabel(null)
    setMessage('')
    setFiles([])
    setUploadError(null)
    setSelectedBatchId(batches.length === 1 ? (batches[0]?.id ?? null) : null)
    setStep(batches.length > 1 ? 0 : batches.length === 1 ? 1 : 0)
    onEntityLaunchFailed?.()
  }

  const showHomeBatchStep =
    view === 'home' &&
    step === 0 &&
    showBatchStep &&
    !isApplyingEntityLaunch &&
    !showEntityLaunchError
  const isResolvingSingleBatch =
    view === 'home' &&
    step === 0 &&
    !showBatchStep &&
    !showEntityLaunchError &&
    (showInboxLoading || batches.length === 1)

  const handleBackdropPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    // Dismissing an open filter dropdown also hits the backdrop — close the menu only.
    if (isFloatingChatSelectOpen()) return
    onClose?.()
  }

  return (
    <>
      {!isFullPage ? (
        <div
          onPointerDown={handleBackdropPointerDown}
          className={cn(
            'fixed inset-0 bg-[#15162c]/30 dark:bg-black/60 backdrop-blur-[2px] z-[205] transition-opacity duration-300',
            isOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none',
          )}
        />
      ) : null}

      <div
        data-testid="floating-chat-panel"
        className={cn(
          'fixed flex flex-col overflow-hidden bg-surface border border-[#e9e9f3] dark:border-border z-[210]',
          isFullPage
            ? 'inset-0 h-dvh w-full rounded-none border-0 shadow-none'
            : cn(
                'transition-transform duration-300 ease-out',
                // Mobile/tablet: full-width sheet above AppMobileTabBar (~4.5rem + safe area).
                'inset-x-3 top-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+3rem)] rounded-[18px] shadow-[0_8px_32px_rgba(20,20,43,0.16)]',
                // Desktop: fixed 512px panel anchored top-right (unchanged width).
                'lg:inset-x-auto lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[512px] lg:rounded-[22px] lg:shadow-[-10px_0_40px_rgba(20,20,43,0.12)]',
                isOpen ? 'translate-x-0' : 'translate-x-[120%]',
              ),
        )}
      >
        <FloatingChatHeader
          view={view}
          step={step}
          selectedTicketId={selectedTicketId}
          showBatchStep={showBatchStep}
          selectedBatch={selectedBatch}
          selectedCategoryObj={selectedCategoryObj}
          selectedItemTitle={selectedItem?.title ?? null}
          selectedTicket={selectedTicket}
          onBack={handleBack}
          onClose={isFullPage || isEmbedded ? undefined : onClose}
        />

        <div className="flex-1 overflow-hidden flex flex-col p-[16px_18px_8px] gap-2.5">
          <div
            ref={threadScrollRef}
            className="flex-1 overflow-y-auto flex flex-col gap-[9px] animate-in slide-in-from-right-2 duration-200 fade-in h-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#e9e9f3] dark:[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full pr-1 -mr-1"
            key={`${view}-${step}-${selectedTicketId}`}
          >
            {isApplyingEntityLaunch && (
              <div
                className="flex flex-1 items-center justify-center py-8"
                data-testid="floating-chat-entity-launch-loading"
              >
                <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                  Loading your item…
                </p>
              </div>
            )}

            {showEntityLaunchError && entityLaunchError && (
              <EntityLaunchErrorPanel
                message={entityLaunchError}
                onRetry={handleEntityLaunchRetry}
                onDismiss={handleEntityLaunchDismiss}
              />
            )}

            {isResolvingSingleBatch && !isApplyingEntityLaunch && (
              <div className="flex flex-1 items-center justify-center py-8">
                <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                  Loading…
                </p>
              </div>
            )}

            {showHomeBatchStep && showInboxLoading && (
              <div className="flex flex-1 items-center justify-center py-8">
                <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                  Loading batches…
                </p>
              </div>
            )}

            {showHomeBatchStep && isInboxError && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                  Couldn&apos;t load your batches.
                </p>
                <button
                  type="button"
                  onClick={onInboxRetry}
                  className="rounded-[10px] border border-[#e9e9f3] dark:border-border bg-surface px-4 py-2 text-[13px] font-bold text-[#15162c] dark:text-foreground hover:bg-[#f0f0fd] dark:hover:bg-brand/10"
                >
                  Try again
                </button>
              </div>
            )}

            {showHomeBatchStep &&
              !showInboxLoading &&
              !isInboxError &&
              batches.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                  <p className="text-[14px] font-bold text-[#15162c] dark:text-foreground">
                    No batches found
                  </p>
                  <p className="text-[12.5px] text-[#62647d] dark:text-foreground-muted">
                    We couldn&apos;t find any batch linked to your account.
                  </p>
                </div>
              )}

            {showHomeBatchStep &&
              !showInboxLoading &&
              !isInboxError &&
              batches.length > 1 && (
                <CourseSelector
                  batches={batches}
                  selectedBatchId={selectedBatchId}
                  onSelect={handleBatchSelect}
                />
              )}

            {view === 'home' &&
              step === 1 &&
              !isApplyingEntityLaunch &&
              !showEntityLaunchError &&
              showInboxLoading && (
                <div className="flex flex-1 items-center justify-center py-8">
                  <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                    Loading…
                  </p>
                </div>
              )}

            {view === 'home' &&
              step === 1 &&
              !isApplyingEntityLaunch &&
              !showEntityLaunchError &&
              !showInboxLoading && (
                <CategorySelector
                  categories={CATEGORIES}
                  onSelect={handleCategorySelect}
                  onRequestCallback={startCallbackFlow}
                />
              )}

            {view === 'home' && step === 2 && selectedCategoryObj && (
              <ItemSelector
                categoryObj={selectedCategoryObj}
                items={selectorItems}
                search={itemSearch}
                onSearchChange={setItemSearch}
                isLoading={
                  usesLearnApi
                    ? isLearnItemsLoading && learnPageData == null
                    : false
                }
                isPageLoading={
                  usesLearnApi
                    ? isLearnItemsFetching && learnPageData != null
                    : false
                }
                isError={usesLearnApi ? isLearnItemsError : false}
                onRetry={
                  usesLearnApi ? () => void refetchLearnItems() : undefined
                }
                pagination={
                  usesLearnApi && learnPageData
                    ? {
                        page: learnPageData.pagination.page,
                        totalPages: learnPageData.pagination.totalPages,
                        hasPreviousPage:
                          learnPageData.pagination.hasPreviousPage,
                        hasNextPage: learnPageData.pagination.hasNextPage,
                        onPageChange: setItemPage,
                      }
                    : undefined
                }
                onSelect={(item) => {
                  setSelectedItem(item)
                  setStep(2.5)
                }}
                lectureTypeFilter={lectureTypeFilter}
                onLectureTypeChange={setLectureTypeFilter}
                attendanceStatusFilter={attendanceStatusFilter}
                onAttendanceStatusChange={setAttendanceStatusFilter}
                assignmentPriorityFilter={assignmentPriorityFilter}
                onAssignmentPriorityChange={setAssignmentPriorityFilter}
                assignmentCategoryFilter={assignmentCategoryFilter}
                onAssignmentCategoryChange={setAssignmentCategoryFilter}
                assignmentCategoryOptions={
                  learnPageData?.filterValues.categoryFilterValues ?? []
                }
                assignmentModuleFilter={assignmentModuleFilter}
                onAssignmentModuleChange={setAssignmentModuleFilter}
                assignmentModuleOptions={
                  learnPageData?.filterValues.moduleFilterValues ?? []
                }
                evaluationProgressFilter={evaluationProgressFilter}
                onEvaluationProgressChange={setEvaluationProgressFilter}
                evaluationModuleFilter={evaluationModuleFilter}
                onEvaluationModuleChange={setEvaluationModuleFilter}
                evaluationModuleOptions={
                  learnPageData?.filterValues.moduleFilterValues ?? []
                }
              />
            )}

            {view === 'home' &&
              step === 2.5 &&
              selectedCategoryObj &&
              selectedItemObj && (
                <ItemConfirmation
                  categoryObj={selectedCategoryObj}
                  itemObj={selectedItemObj}
                  onConfirm={() => {
                    if (supportCategoryUsesLearnApi(selectedCategoryObj.id)) {
                      setStep(2.8)
                    } else {
                      goToComposer(2.5)
                    }
                  }}
                  onDirectQuery={(query) => {
                    setMessage(query)
                    goToComposer(2.5)
                  }}
                  onReviewItem={onReviewItem}
                />
              )}

            {view === 'home' &&
              step === 2.8 &&
              selectedCategoryObj &&
              subcategoryCategory && (
                <QuickQuerySelector
                  queries={subcategoryOptions}
                  isLoading={isSubcategoriesLoading}
                  isError={isSubcategoriesError}
                  onRetry={() => void refetchSubcategories()}
                  onSelect={(option) => {
                    setSelectedSubCategory(option.value)
                    setSelectedSubCategoryLabel(option.label)
                    setMessage('')
                    goToComposer(2.8)
                  }}
                />
              )}

            {view === 'home' && step === 3 && (
              <ChatThread
                isInitialBotGreeting
                categoryObj={selectedCategoryObj}
                selectedItemTitle={selectedItem?.title ?? null}
                messages={[]}
              />
            )}

            {view === 'home' && step === 4 && (
              <>
                {uploadError && (
                  <p className="mb-2 rounded-[10px] bg-[#fef2f2] dark:bg-danger-subtle px-3 py-2 text-[12.5px] font-medium text-[#b42318] dark:text-danger-subtle-foreground">
                    {uploadError}
                  </p>
                )}
                <CallbackReasonSelector
                  reasons={callbackReasons}
                  contact={callbackContact}
                  onSelect={handleCallbackReasonSelect}
                />
              </>
            )}

            {view === 'home' && step === 5 && (
              <>
                {uploadError && (
                  <p className="mb-2 rounded-[10px] bg-[#fef2f2] dark:bg-danger-subtle px-3 py-2 text-[12.5px] font-medium text-[#b42318] dark:text-danger-subtle-foreground">
                    {uploadError}
                  </p>
                )}
                <CallbackTimeSelector
                  timeslots={callbackTimeslots}
                  isSubmitting={isSubmittingCallback}
                  onSubmit={handleCallbackTimeslotSubmit}
                />
              </>
            )}

            {view === 'home' && step === 6 && (
              <CallbackStatus
                status={callbackStatus}
                preferredTimeslot={selectedCallbackTimeslot}
                onClose={goToHomeStart}
              />
            )}

            {view === 'oneOnOne' && (
              <>
                {showInboxLoading ? (
                  <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                      Loading 1:1 sessions…
                    </p>
                  </div>
                ) : isInboxError ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                    <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                      Couldn&apos;t load 1:1 sessions.
                    </p>
                    <button
                      type="button"
                      onClick={onInboxRetry}
                      className="rounded-[10px] border border-[#e9e9f3] dark:border-border bg-surface px-4 py-2 text-[13px] font-bold text-[#15162c] dark:text-foreground hover:bg-[#f0f0fd] dark:hover:bg-brand/10"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <FloatingOneOnOneTab groups={oneOnOneGroups} />
                )}
              </>
            )}

            {view === 'tickets' && !selectedTicketId && (
              <>
                {showInboxLoading ? (
                  <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                      Loading tickets…
                    </p>
                  </div>
                ) : isInboxError ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                    <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                      Couldn&apos;t load your tickets.
                    </p>
                    <button
                      type="button"
                      onClick={onInboxRetry}
                      className="rounded-[10px] border border-[#e9e9f3] dark:border-border bg-surface px-4 py-2 text-[13px] font-bold text-[#15162c] dark:text-foreground hover:bg-[#f0f0fd] dark:hover:bg-brand/10"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <TicketList
                    tickets={tickets}
                    callbackTickets={callbackTickets}
                    filter={ticketFilter}
                    onFilterChange={setTicketFilter}
                    onTicketSelect={setSelectedTicketId}
                  />
                )}
              </>
            )}

            {view === 'tickets' && selectedTicketId && (
              <>
                {isThreadLoading && (
                  <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-[13px] text-[#62647d] dark:text-foreground-muted">
                      Loading conversation…
                    </p>
                  </div>
                )}
                {!isThreadLoading && threadMessages.length > 0 && (
                  <ChatThread
                    messages={threadMessages}
                    assignee={ticketThread?.ticket.assignee}
                    reopenedAt={ticketThread?.ticket.reopenedAt}
                    ticketStatus={ticketThread?.ticket.status}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {((view === 'home' && step === 3) ||
          (view === 'tickets' &&
            selectedTicketId &&
            (!isTicketResolved || isEscalating))) && (
          <ChatComposer
            selectedTopic={selectedSubCategoryLabel}
            onClearTopic={() => {
              setSelectedSubCategory(null)
              setSelectedSubCategoryLabel(null)
            }}
            message={message}
            onChange={setMessage}
            placeholder={
              view === 'tickets'
                ? 'Reply to this ticket...'
                : selectedSubCategoryLabel
                  ? 'Any extra details we should know? (Optional)'
                  : 'Describe your issue...'
            }
            files={files}
            onFilesSelected={addFiles}
            onRemoveFile={removeFile}
            onSend={() => void handleComposerSend()}
            uploading={uploading}
            uploadError={uploadError}
            disabled={isSubmitting}
          />
        )}

        {view === 'home' && step === 2.8 && (
          <div className="shrink-0 p-[12px_18px_14px] border-t border-[#e9e9f3] dark:border-border bg-surface transition-all duration-200 ease-out">
            <button
              type="button"
              onClick={() => {
                setSelectedSubCategory(null)
                setSelectedSubCategoryLabel(null)
                setMessage('')
                goToComposer(2.8)
              }}
              className="flex w-full items-center justify-center gap-2 p-[13px] rounded-[10px] bg-[#f8f8fc] dark:bg-muted/40 border-[1.5px] border-[#e9e9f3] dark:border-border text-[#4b4396] dark:text-brand font-bold text-[14px] hover:bg-[#f0f0fd] dark:hover:bg-brand/10 hover:border-[#d6d6f5] dark:hover:border-brand/40 transition-all group"
            >
              My issue is not listed
            </button>
          </div>
        )}

        {showResolvedFeedback && (
          <ResolvedTicketFeedback
            key={selectedTicketId}
            alreadySubmitted={hasSubmittedRating}
            isSubmitting={isFeedbackSubmitting}
            submitError={
              rateTicketMutation.isError ||
              reopenTicketMutation.isError ||
              escalateTicketMutation.isError
                ? 'Couldn’t save your feedback. Please try again.'
                : null
            }
            onSubmitRating={handleSubmitTicketRating}
            onReopenEscalate={handleReopenEscalateTicket}
          />
        )}

        <div className="flex shrink-0 border-t border-[#e9e9f3] dark:border-border bg-surface z-10 relative">
          <button
            type="button"
            onClick={() => handleSwitchTab('home')}
            className={cn(
              'flex-1 flex flex-col items-center gap-[3px] p-[9px_0_10px] text-[10.8px] font-bold transition-colors group',
              view === 'home'
                ? 'text-[#4b4396] dark:text-brand'
                : 'text-[#9496ab] dark:text-foreground-subtle hover:text-[#4b4396] dark:hover:text-brand',
            )}
          >
            <Lifebuoy weight="bold" className="size-[19px]" />
            <span>Help</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab('tickets')}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-[3px] p-[9px_0_10px] text-[10.8px] font-bold transition-colors group',
              view === 'tickets'
                ? 'text-[#4b4396] dark:text-brand'
                : 'text-[#9496ab] dark:text-foreground-subtle hover:text-[#4b4396] dark:hover:text-brand',
            )}
          >
            <Ticket weight="bold" className="size-[19px]" />
            <span>My Tickets</span>
            {openTicketCount > 0 && (
              <span className="absolute top-1 right-[calc(50%-20px)] flex items-center justify-center min-w-[15px] h-[15px] rounded-full bg-[#e1473d] text-white text-[9.5px] font-extrabold px-[3px]">
                {openTicketCount}
              </span>
            )}
          </button>
          {hasOneOnOne && (
            <button
              type="button"
              onClick={() => handleSwitchTab('oneOnOne')}
              className={cn(
                'flex-1 flex flex-col items-center gap-[3px] p-[9px_0_10px] text-[10.8px] font-bold transition-colors group',
                view === 'oneOnOne'
                  ? 'text-[#4b4396] dark:text-brand'
                  : 'text-[#9496ab] dark:text-foreground-subtle hover:text-[#4b4396] dark:hover:text-brand',
              )}
            >
              <CalendarCheck weight="bold" className="size-[19px]" />
              <span>1:1 Support</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
