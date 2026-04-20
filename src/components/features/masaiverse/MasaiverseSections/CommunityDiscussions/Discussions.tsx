import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
import { Search } from 'lucide-react'
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
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(
    initialDiscussionPage && initialDiscussionPage > 0 ? initialDiscussionPage : 1,
  )
  const [searchInput, setSearchInput] = useState(initialDiscussionSearch ?? '')
  const [searchTerm, setSearchTerm] = useState(initialDiscussionSearch ?? '')
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true)
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
    if (showInitialLoader || posts.length === 0) {
      setIsLoadingDiscussions(true)
    }
    try {
      const response = await fetchCommunityDiscussions({
        data: {
          sortBy: selectedSort,
          clubId: isAdmin ? (selectedClub ?? undefined) : undefined,
          search: selectedSearch.trim() || undefined,
          page: selectedPage,
          limit: 10,
        },
      })
      if (requestId !== latestRefreshRequestIdRef.current) {
        return
      }
      setPosts(response.posts)
      setCurrentPage(response.page)
      setTotalPages(response.totalPages)
      setSortBy(response.sortBy)
      if (isAdmin) {
        const resolvedClubId = response.selectedClubId ?? selectedClub ?? null
        setSelectedClubId((prevSelectedClubId) =>
          prevSelectedClubId === resolvedClubId ? prevSelectedClubId : resolvedClubId,
        )
      }
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
    try {
      await createCommunityPost({
        data: {
          title: title.trim(),
          content: description,
          clubId: isAdmin ? (selectedClubId ?? undefined) : undefined,
        },
      })
      await refreshDiscussions()
      setIsCreateModalOpen(false)
      setTitle('')
      setDescription('')
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
      {isLoadingDiscussions ? (
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
          Loading discussions...
        </div>
      ) : (
        <DiscussionsList
          isAdmin={isAdmin}
          posts={posts}
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
