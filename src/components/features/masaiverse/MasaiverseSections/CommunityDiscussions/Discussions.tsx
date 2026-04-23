import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import DiscussionsList from './DiscussionsList'
import type { ClubType } from '@/server/masaiverse/fetchClubs'
import type {
  DiscussionEntityId,
  DiscussionPost,
  DiscussionSortMode,
} from '@/server/masaiverse/communityDiscussions'
import {
  createCommunityPost,
  createCommunityReply,
  fetchCommunityDiscussions,
  toggleCommunityPostBan,
  toggleCommunityPostBookmark,
  voteCommunityPost,
  voteCommunityReply,
} from '@/server/masaiverse/communityDiscussions'
import { Pagination as AppPagination } from '@/components/common'
import { RichTextEditor } from '@/components/discussion-post-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const discussionSortOptions: Array<{ key: DiscussionSortMode; label: string }> =
  [
    { key: 'new', label: 'New' },
    { key: 'hot', label: 'Hot' },
    { key: 'top', label: 'Top' },
  ]

type DiscussionsProps = {
  isAdmin: boolean
  clubs: Array<ClubType>
  joinedClubId: string | null
  initialPostIdFromSearch?: string
  initialCreateDiscussionOpen?: boolean
  initialDiscussionSearch?: string
  initialDiscussionPage?: number
}

const TITLE_MAX_LENGTH = 500
const DESCRIPTION_MAX_LENGTH = 5000

type ClientErrorDetails = {
  message: string
  type: string | null
  code: string | null
  status: number | null
  sqlState: string | null
  sqlMessage: string | null
  raw: unknown
}

const toErrorRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

const asStringOrNull = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim() ? value : null
}

const asNumberOrNull = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const extractClientErrorDetails = (error: unknown): ClientErrorDetails => {
  const errorRecord = toErrorRecord(error)
  const causeRecord = toErrorRecord(errorRecord?.cause)
  const dataRecord = toErrorRecord(errorRecord?.data)
  const nestedErrorRecord = toErrorRecord(dataRecord?.error)
  const nestedDataRecord = toErrorRecord(dataRecord?.data)

  const message = [
    asStringOrNull(errorRecord?.message),
    asStringOrNull(causeRecord?.message),
    asStringOrNull(dataRecord?.message),
    asStringOrNull(nestedErrorRecord?.message),
    asStringOrNull(nestedDataRecord?.message),
  ].find(Boolean) ?? 'UNKNOWN_ERROR'

  const type = [
    asStringOrNull(errorRecord?.name),
    asStringOrNull(causeRecord?.name),
    asStringOrNull(dataRecord?.type),
    asStringOrNull(nestedErrorRecord?.name),
  ].find(Boolean) ?? null

  const code = [
    asStringOrNull(errorRecord?.code),
    asStringOrNull(causeRecord?.code),
    asStringOrNull(dataRecord?.code),
    asStringOrNull(nestedErrorRecord?.code),
    asStringOrNull(nestedDataRecord?.code),
  ].find(Boolean) ?? null

  const status = [
    asNumberOrNull(errorRecord?.status),
    asNumberOrNull(causeRecord?.status),
    asNumberOrNull(dataRecord?.status),
    asNumberOrNull(nestedErrorRecord?.status),
  ].find((value) => value !== null) ?? null

  const sqlState = [
    asStringOrNull(errorRecord?.sqlState),
    asStringOrNull(causeRecord?.sqlState),
    asStringOrNull(dataRecord?.sqlState),
    asStringOrNull(nestedErrorRecord?.sqlState),
    asStringOrNull(nestedDataRecord?.sqlState),
  ].find(Boolean) ?? null

  const sqlMessage = [
    asStringOrNull(errorRecord?.sqlMessage),
    asStringOrNull(causeRecord?.sqlMessage),
    asStringOrNull(dataRecord?.sqlMessage),
    asStringOrNull(nestedErrorRecord?.sqlMessage),
    asStringOrNull(nestedDataRecord?.sqlMessage),
  ].find(Boolean) ?? null

  return {
    message,
    type,
    code,
    status,
    sqlState,
    sqlMessage,
    raw: error,
  }
}

const Disucssions = ({
  isAdmin,
  clubs,
  joinedClubId,
  initialPostIdFromSearch,
  initialCreateDiscussionOpen = false,
  initialDiscussionSearch,
  initialDiscussionPage,
}: DiscussionsProps) => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Array<DiscussionPost>>([])
  const [currentUserName, setCurrentUserName] = useState<string>('You')
  const [currentUserProfileImage, setCurrentUserProfileImage] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(
    initialDiscussionPage && initialDiscussionPage > 0 ? initialDiscussionPage : 1,
  )
  const [searchInput, setSearchInput] = useState(initialDiscussionSearch ?? '')
  const [searchTerm, setSearchTerm] = useState(initialDiscussionSearch ?? '')
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true)
  const [discussionsError, setDiscussionsError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateDiscussionOpen)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sortBy, setSortBy] = useState<DiscussionSortMode>('new')
  const [selectedClubId, setSelectedClubId] = useState<string | null>(joinedClubId)
  const [openPostId, setOpenPostId] = useState<string | null>(
    initialPostIdFromSearch ?? null,
  )
  const latestRefreshRequestIdRef = useRef(0)

  const normalizedClubOptions = useMemo(
    () =>
      clubs.map((club) => ({
        id: String(club.id),
        name: club.name,
      })),
    [clubs],
  )

  useEffect(() => {
    if (!isAdmin) {
      setSelectedClubId(joinedClubId)
      return
    }

    if (selectedClubId && normalizedClubOptions.some((club) => club.id === selectedClubId)) {
      return
    }

    const fallbackClubId = joinedClubId
      && normalizedClubOptions.some((club) => club.id === joinedClubId)
      ? joinedClubId
      : (normalizedClubOptions[0]?.id ?? null)
    setSelectedClubId(fallbackClubId)
  }, [isAdmin, joinedClubId, normalizedClubOptions, selectedClubId])

  useEffect(() => {
    setOpenPostId(initialPostIdFromSearch ?? null)
  }, [initialPostIdFromSearch])

  useEffect(() => {
    setSearchInput(initialDiscussionSearch ?? '')
    setSearchTerm(initialDiscussionSearch ?? '')
  }, [initialDiscussionSearch])

  useEffect(() => {
    setCurrentPage(
      initialDiscussionPage && initialDiscussionPage > 0 ? initialDiscussionPage : 1,
    )
  }, [initialDiscussionPage])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchInput === searchTerm) {
        return
      }
      setSearchTerm(searchInput)
      setCurrentPage(1)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchInput, searchTerm])

  useEffect(() => {
    if (initialCreateDiscussionOpen) {
      setIsCreateModalOpen(true)
    }
  }, [initialCreateDiscussionOpen])

  const refreshDiscussions = async (
    showInitialLoader = false,
    selectedSort: DiscussionSortMode = sortBy,
    selectedClub: string | null = selectedClubId,
    selectedSearch: string = searchTerm,
    selectedPage: number = currentPage,
  ) => {
    const requestId = latestRefreshRequestIdRef.current + 1
    latestRefreshRequestIdRef.current = requestId
    const requestPayload = {
      sortBy: selectedSort,
      clubId: isAdmin ? (selectedClub ?? undefined) : undefined,
      search: selectedSearch.trim() || undefined,
      page: selectedPage,
      limit: 10,
      isAdmin,
      selectedClubId: selectedClub,
    }
    if (showInitialLoader || posts.length === 0) {
      setIsLoadingDiscussions(true)
    }
    setDiscussionsError(null)
    try {
      const response = await fetchCommunityDiscussions({
        data: requestPayload,
      })
      const responseForValidation = response as unknown
      const responseRecord = toErrorRecord(responseForValidation)
      if (!responseRecord || !Array.isArray(responseRecord.posts)) {
        const invalidResponseError = new Error(
          'INVALID_DISCUSSIONS_RESPONSE: expected payload with posts[]',
        ) as Error & {
          response?: unknown
          requestPayload?: unknown
        }
        invalidResponseError.response = responseForValidation
        invalidResponseError.requestPayload = requestPayload
        throw invalidResponseError
      }
      if (requestId !== latestRefreshRequestIdRef.current) {
        return
      }
      setPosts(response.posts)
      setCurrentUserName(response.currentUserName ?? 'You')
      setCurrentUserProfileImage(response.currentUserProfileImage ?? null)
      setCurrentPage(response.page)
      setTotalPages(response.totalPages)
      setSortBy(response.sortBy)
      if (isAdmin) {
        const resolvedClubId = response.selectedClubId ?? selectedClub ?? null
        setSelectedClubId((prevSelectedClubId) =>
          prevSelectedClubId === resolvedClubId ? prevSelectedClubId : resolvedClubId,
        )
      }
    } catch (error) {
      if (requestId !== latestRefreshRequestIdRef.current) {
        return
      }
      const details = extractClientErrorDetails(error)
      const errorRecord = toErrorRecord(error)
      const invalidResponse =
        errorRecord?.response ?? errorRecord?.data ?? null

      console.groupCollapsed(
        '[communityDiscussions.refresh] failed - detailed diagnostics',
      )
      console.error('Request payload', requestPayload)
      console.error('Resolved error details', {
        message: details.message,
        type: details.type,
        code: details.code,
        status: details.status,
        sqlState: details.sqlState,
        sqlMessage: details.sqlMessage,
      })
      console.error('Invalid/raw response payload', invalidResponse)
      console.error('Raw error object', details.raw)
      if (error instanceof Error && error.stack) {
        console.error('Stack trace', error.stack)
      }
      console.groupEnd()

      setDiscussionsError('Unable to load discussions right now. Please try again.')
    } finally {
      if (requestId === latestRefreshRequestIdRef.current) {
        setIsLoadingDiscussions(false)
      }
    }
  }

  useEffect(() => {
    void refreshDiscussions(true, sortBy, selectedClubId, searchTerm, currentPage)
  }, [isAdmin, selectedClubId, searchTerm, currentPage])

  useEffect(() => {
    navigate({
      to: '/masaiverse',
      replace: true,
      search: (prev) => ({
        ...prev,
        tab: 'home' as const,
        discussionSearch: searchTerm.trim() || undefined,
        discussionPage: currentPage > 1 ? currentPage : undefined,
      }),
    })
  }, [currentPage, navigate, searchTerm])

  const getDescriptionPlainText = (html: string) =>
    html.replace(/<\s*br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ').trim()

  const descriptionLength = getDescriptionPlainText(description).length

  const canSubmit = useMemo(() => {
    return (
      Boolean(title.trim()) &&
      Boolean(getDescriptionPlainText(description)) &&
      descriptionLength <= DESCRIPTION_MAX_LENGTH
    )
  }, [description, descriptionLength, title])

  const handleCreatePost = async () => {
    setIsPosting(true)
    setDiscussionsError(null)
    const createPayload = {
      title: title.trim(),
      content: description,
      clubId: isAdmin ? (selectedClubId ?? undefined) : undefined,
      isAdmin,
      selectedClubId,
    }
    try {
      await createCommunityPost({
        data: createPayload,
      })
      await refreshDiscussions()
      setIsCreateModalOpen(false)
      setTitle('')
      setDescription('')
    } catch (error) {
      const details = extractClientErrorDetails(error)
      console.groupCollapsed(
        '[communityDiscussions.createPost] failed - detailed diagnostics',
      )
      console.error('Request payload', createPayload)
      console.error('Resolved error details', {
        message: details.message,
        type: details.type,
        code: details.code,
        status: details.status,
        sqlState: details.sqlState,
        sqlMessage: details.sqlMessage,
      })
      console.error('Raw error object', details.raw)
      if (error instanceof Error && error.stack) {
        console.error('Stack trace', error.stack)
      }
      console.groupEnd()
      const debugParts = [
        details.message,
        details.code,
        details.sqlState,
      ].filter(Boolean)
      setDiscussionsError(
        debugParts.length > 0
          ? `Create post failed: ${debugParts.join(' | ')}`
          : 'Unable to create discussion right now. Please try again.',
      )
    } finally {
      setIsPosting(false)
    }
  }

  const handleReply = async (postId: DiscussionEntityId, content: string) => {
    await createCommunityReply({ data: { postId, content } })
    await refreshDiscussions()
  }

  const handleVotePost = async (
    postId: DiscussionEntityId,
    vote: 'upvote' | 'downvote',
  ) => {
    await voteCommunityPost({ data: { postId, vote } })
    await refreshDiscussions()
  }

  const handleVoteReply = async (
    replyId: string,
    vote: 'upvote' | 'downvote',
  ) => {
    await voteCommunityReply({ data: { replyId, vote } })
    await refreshDiscussions()
  }

  const handleToggleBookmark = async (postId: DiscussionEntityId) => {
    await toggleCommunityPostBookmark({ data: { postId } })
    await refreshDiscussions()
  }

  const handleTogglePostBan = async (
    postId: DiscussionEntityId,
    shouldBan: boolean,
  ) => {
    await toggleCommunityPostBan({ data: { postId, shouldBan } })
    await refreshDiscussions()
  }

  const removePostIdSearchParam = () => {
    navigate({
      to: '/masaiverse',
      replace: true,
      search: (prev) => ({
        ...prev,
        tab: 'home',
        postId: undefined,
        createDiscussion: undefined,
      }),
    })
  }

  const handleCreateModalOpenChange = (open: boolean) => {
    setIsCreateModalOpen(open)
    if (!open) {
      navigate({
        to: '/masaiverse',
        replace: true,
        search: (prev) => ({
          ...prev,
          tab: 'home' as const,
          postId: undefined,
          createDiscussion: undefined,
        }),
      })
    }
  }

  const handlePostDrawerOpenChange = (postId: string, open: boolean) => {
    setOpenPostId(open ? postId : null)
    if (!open) {
      removePostIdSearchParam()
    }
  }

  return (
    <div className="space-y-4">
      {posts.length > 0 ? (
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#6B7280]">
              Keep the conversation going. Share your thoughts or ask a question.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="shrink-0 rounded-md border border-[#EF8833] bg-[#FFF7ED] px-3 py-2 text-sm font-semibold text-[#C96B1E] hover:bg-[#FBE7D6]"
            >
              Create Discussion
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search discussions"
            className="h-11 w-full bg-white pl-10"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {discussionSortOptions.map((option) => {
            const isActive = sortBy === option.key
            return (
              <button
                key={option.key}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors text-[#4B5563] ${
                  isActive
                    ? 'border-[#EF8833] bg-[#FBE7D6] text-[#C96B1E]'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]'
                }`}
                onClick={() => {
                  if (sortBy === option.key) return
                  setSortBy(option.key)
                  setCurrentPage(1)
                  void refreshDiscussions(false, option.key, selectedClubId, searchTerm, 1)
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {isAdmin && normalizedClubOptions.length > 0 ? (
          <Select
            value={selectedClubId ?? ''}
            onValueChange={(value) => {
              const clubId = String(value)
              setSelectedClubId(clubId)
            }}
          >
            <SelectTrigger className="w-[220px] bg-white text-xs md:text-sm">
              <SelectValue placeholder="Select a club" />
            </SelectTrigger>
            <SelectContent>
              {normalizedClubOptions.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      {discussionsError ? (
        <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#B91C1C]">
          {discussionsError}
        </div>
      ) : null}
      {isLoadingDiscussions ? (
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
          Loading discussions...
        </div>
      ) : (
        <DiscussionsList
          isAdmin={isAdmin}
          posts={posts}
          currentUserName={currentUserName}
          currentUserProfileImage={currentUserProfileImage}
          onVotePost={handleVotePost}
          onVoteReply={handleVoteReply}
          onReply={handleReply}
          onToggleBookmark={handleToggleBookmark}
          onTogglePostBan={handleTogglePostBan}
          openPostId={openPostId}
          onPostDrawerOpenChange={handlePostDrawerOpenChange}
          onCreateDiscussionClick={() => setIsCreateModalOpen(true)}
        />
      )}
      <AppPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
      <Modal open={isCreateModalOpen} onOpenChange={handleCreateModalOpenChange}>
        <ModalContent className="max-w-2xl space-y-4">
          <div>
            <ModalTitle>Create Discussion</ModalTitle>
            <ModalDescription className="mt-1">
              Add a title and description to start a community discussion.
            </ModalDescription>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="discussion-title" className="text-sm font-medium text-[#111827]">
                Title
              </label>
              <span className="text-xs text-[#6B7280]">
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            </div>
            <Input
              id="discussion-title"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Write a title"
            />
            <p className="text-xs text-[#6B7280]">
              Title is saved in bold format.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#111827]">
                Description
              </label>
              <span className="text-xs text-[#6B7280]">
                {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Write your discussion description..."
              contentClassName="[&_p]:my-0 [&_p+p]:mt-2"
            />
            <p className="text-xs text-[#6B7280]">
              Description supports up to {DESCRIPTION_MAX_LENGTH} characters.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCreateModalOpenChange(false)}
              disabled={isPosting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleCreatePost()
              }}
              disabled={!canSubmit || isPosting}
            >
              {isPosting ? 'Creating...' : 'Create Discussion'}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default Disucssions
