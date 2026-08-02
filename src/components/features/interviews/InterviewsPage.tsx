import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Check, CircleDashed, LoaderCircleIcon } from 'lucide-react'
import type {
  InterviewSessionSummary,
  InterviewTopic,
} from '@/server/api/interviews/types/interviewSession'
import { streamCreateInterviewSession } from '@/lib/api/interviews/streamCreateInterviewSession'
import { createInterviewAudioPlayer } from '@/lib/audio/interviewAudioPlayer'
import { interviewTopicsQuery } from '@/query/interviews/interviewTopicsQuery'
import { interviewSessionsQuery } from '@/query/interviews/interviewSessionsQuery'
import { toast } from '@/lib/toast'
import { getTopicIcon } from './topicIcons'
import { SpinnerIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)

function TopicButton({
  topic,
  isSelected,
  isDisabled,
  onSelect,
}: {
  topic: InterviewTopic
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
}) {
  const Icon = getTopicIcon(topic.iconKey)
  return (
    <button
      type="button"
      data-testid="interview-topic-item"
      data-topic-id={topic.id}
      onClick={onSelect}
      disabled={isDisabled}
      aria-pressed={isSelected}
      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
        isSelected
          ? 'border-brand bg-brand/5'
          : 'border-border bg-surface hover:bg-surface-muted'
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          isSelected
            ? 'bg-brand text-brand-foreground'
            : 'bg-surface-muted text-foreground-muted'
        }`}
        aria-hidden
      >
        <Icon className={cn('size-4', isSelected && 'opacity-25')} />
        <LoaderCircleIcon
          className={cn('animate-spin absolute', !isSelected && 'hidden')}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="type-b1-md block font-medium text-foreground">
          {topic.label}
        </span>
        <span className="text-xs line-clamp-2 lg:line-clamp-2 text-foreground-muted">
          {topic.blurb}
        </span>
      </span>
      {isSelected ? (
        <Check className="size-5 shrink-0 text-brand" aria-hidden />
      ) : null}
    </button>
  )
}

function TopicGroup({
  title,
  topics,
  creatingTopicId,
  onSelect,
}: {
  title: string
  topics: Array<InterviewTopic>
  creatingTopicId: string | null
  onSelect: (topic: InterviewTopic) => void
}) {
  if (topics.length === 0) return null

  return (
    <div data-testid="interview-topic-group" className="mb-6">
      <h2 className="type-b2-md mb-2 font-semibold text-foreground-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {topics.map((topic) => (
          <TopicButton
            key={topic.id}
            topic={topic}
            isSelected={creatingTopicId === topic.id}
            isDisabled={creatingTopicId !== null}
            onSelect={() => onSelect(topic)}
          />
        ))}
      </div>
    </div>
  )
}

function SessionStatusIcon({
  status,
}: {
  status: InterviewSessionSummary['status']
}) {
  if (status === 'completed') {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success-subtle-foreground"
        aria-hidden
      >
        <Check className="size-4" />
      </span>
    )
  }

  if (status === 'in_progress') {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-subtle text-warning-subtle-foreground"
        aria-hidden
      >
        <CircleDashed className="size-4 group-hover:animate-spin [animation-duration:2s]" />
      </span>
    )
  }

  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-foreground-muted"
      aria-hidden
    >
      <CircleDashed className="size-4" />
    </span>
  )
}

function sessionStatusLabel(status: InterviewSessionSummary['status']) {
  if (status === 'completed') return 'Completed'
  if (status === 'in_progress') return 'In progress'
  return 'Abandoned'
}

function SessionRow({ session }: { session: InterviewSessionSummary }) {
  const navigate = useNavigate()
  const startedAt = session.createdAt ? dayjs(session.createdAt) : null

  return (
    <button
      type="button"
      data-testid="interview-session-item"
      data-session-id={session.id}
      data-status={session.status}
      onClick={() =>
        void navigate({
          to: '/interviews/$sessionId',
          params: { sessionId: String(session.id) },
        })
      }
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-muted"
    >
      <SessionStatusIcon status={session.status} />
      <span className="flex-1 min-w-0">
        <span className="type-b1-md block truncate font-medium text-foreground">
          {session.topicLabel}
        </span>
        <span className="text-xs text-foreground-muted">
          {sessionStatusLabel(session.status)}
          {startedAt ? ` · ${startedAt.fromNow()}` : null}
        </span>
      </span>
    </button>
  )
}

function SessionsSection() {
  const { data, isPending, isError } = useQuery(interviewSessionsQuery())

  if (isPending) {
    return (
      <div className="mb-6 flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-[68px] animate-pulse rounded-xl bg-surface-muted"
          />
        ))}
      </div>
    )
  }

  if (isError || !data || data.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="type-b2-md mb-2 font-semibold text-foreground-muted">
        Your sessions
      </h2>
      <div data-testid="interview-session-list" className="flex flex-col gap-2">
        {data.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}

function InterviewsPageSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[68px] animate-pulse rounded-xl bg-surface-muted"
        />
      ))}
    </div>
  )
}

export function InterviewsPage() {
  const navigate = useNavigate()
  const { data, isPending, isError } = useQuery(interviewTopicsQuery())
  const [creatingTopicId, setCreatingTopicId] = useState<string | null>(null)

  async function handleSelect(topic: InterviewTopic) {
    if (creatingTopicId) return
    setCreatingTopicId(topic.id)

    // Plays the interviewer's spoken greeting/opening question as it streams
    // in — intentionally not cancelled on success so it keeps playing
    // through the navigation to the session page below.
    const player = createInterviewAudioPlayer()

    const outcome = await new Promise<
      { status: 'done'; sessionId: number } | { status: 'error' }
    >((resolve) => {
      streamCreateInterviewSession(topic.id, {
        onAudioDelta: (data) => player.pushChunk(data),
        onDone: (result) => {
          player.finish()
          resolve({ status: 'done', sessionId: result.sessionId })
        },
        onError: () => {
          player.cancel()
          resolve({ status: 'error' })
        },
      })
    })

    if (outcome.status === 'done') {
      await navigate({
        to: '/interviews/$sessionId',
        params: { sessionId: String(outcome.sessionId) },
      })
    } else {
      toast.error('Could not start the interview. Please try again.')
      setCreatingTopicId(null)
    }
  }

  return (
    <div className="mx-auto w-full pb-8">
      <h1 className="type-h4 mb-1 font-semibold text-foreground">
        Practice Interviews
      </h1>
      <p className="mb-6 text-sm text-foreground-muted">
        Pick a topic to start a mock interview with an AI interviewer.
      </p>

      {isPending ? <InterviewsPageSkeleton /> : null}

      {isError ? (
        <p className="text-sm text-foreground-muted">
          Couldn't load interview topics. Please refresh and try again.
        </p>
      ) : null}

      {data ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
          <div className="order-1">
            <TopicGroup
              title="From your coursework"
              topics={data.curriculumTopics}
              creatingTopicId={creatingTopicId}
              onSelect={(topic) => void handleSelect(topic)}
            />
          </div>
          <div className="order-3">
            <TopicGroup
              title="Recommended for your program"
              topics={data.catalogTopics}
              creatingTopicId={creatingTopicId}
              onSelect={(topic) => void handleSelect(topic)}
            />
          </div>
          <div className="order-4">
            <SessionsSection />
          </div>
        </div>
      ) : null}
    </div>
  )
}
