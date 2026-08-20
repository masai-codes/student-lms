import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ArrowRightIcon, Check, CircleDashed } from 'lucide-react'
import type {
  InterviewSessionSummary,
  InterviewTopic,
} from '@/server/api/interviews/types/interviewSession'
import { streamCreateInterviewSession } from '@/lib/api/interviews/streamCreateInterviewSession'
import { createInterviewAudioPlayer } from '@/lib/audio/interviewAudioPlayer'
import { interviewTopicsQuery } from '@/query/interviews/interviewTopicsQuery'
import { interviewSessionsQuery } from '@/query/interviews/interviewSessionsQuery'
import { toast } from '@/lib/toast'
import { LectureAiChatLanguagePicker } from '@/components/features/lecture-ai-chat/components/LectureAiChatLanguagePicker'
import {
  readStoredAiLectureChatLanguage,
  writeStoredAiLectureChatLanguage,
} from '@/components/features/lecture-ai-chat/languages'
import { INTERVIEW_LANGUAGES, toInterviewLanguage } from './interviewLanguages'
import { getTopicIcon } from './topicIcons'
import { TopicCard } from './TopicCard'
import { SubtopicDrawer } from './SubtopicDrawer'

dayjs.extend(relativeTime)

function CourseworkHighlight({
  topic,
  isDisabled,
  onSelect,
}: {
  topic: InterviewTopic
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
      className="group flex w-full items-center gap-4 rounded-2xl border border-brand/20 bg-brand-subtle p-4 text-left transition-opacity disabled:opacity-60 sm:p-5"
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground"
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-b1-md block font-medium text-brand-subtle-foreground">
          {topic.label}
        </span>
        <span className="type-b3-regular block truncate text-brand-subtle-foreground/80">
          {topic.blurb}
        </span>
      </span>
      <span className="type-b2-md hidden shrink-0 items-center gap-1 text-brand-subtle-foreground sm:flex">
        Start
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
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
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-muted"
    >
      <SessionStatusIcon status={session.status} />
      <span className="min-w-0 flex-1">
        <span className="type-b2-md block truncate font-medium text-foreground">
          {session.topicLabel}
        </span>
        <span className="type-b3-regular text-foreground-muted">
          {sessionStatusLabel(session.status)}
          {startedAt ? ` · ${startedAt.fromNow()}` : null}
        </span>
      </span>
    </button>
  )
}

function SessionsRail() {
  const { data, isPending, isError } = useQuery(interviewSessionsQuery())

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-16 lg:w-72">
      <h2 className="type-b2-md mb-2 font-semibold text-foreground-muted">
        Your sessions
      </h2>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[60px] animate-pulse rounded-xl bg-surface-muted"
            />
          ))}
        </div>
      ) : null}

      {!isPending && (isError || !data || data.length === 0) ? (
        <p className="type-b3-regular rounded-xl border border-dashed border-border p-3 text-foreground-muted">
          No practice sessions yet — pick a topic to start your first one.
        </p>
      ) : null}

      {data && data.length > 0 ? (
        <div
          data-testid="interview-session-list"
          className="flex flex-col gap-2"
        >
          {data.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      ) : null}
    </aside>
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
  const [customizingTopic, setCustomizingTopic] =
    useState<InterviewTopic | null>(null)
  const [language, setLanguage] = useState(() =>
    toInterviewLanguage(readStoredAiLectureChatLanguage()),
  )

  function handleLanguageChange(next: typeof language) {
    setLanguage(next)
    writeStoredAiLectureChatLanguage(next)
  }

  async function handleSelect(
    topic: InterviewTopic,
    subtopics?: Array<string>,
  ) {
    if (creatingTopicId) return
    setCreatingTopicId(topic.id)

    // Plays the interviewer's spoken greeting/opening question as it streams
    // in — intentionally not cancelled on success so it keeps playing
    // through the navigation to the session page below.
    const player = createInterviewAudioPlayer()

    const outcome = await new Promise<
      { status: 'done'; sessionId: number } | { status: 'error' }
    >((resolve) => {
      streamCreateInterviewSession(
        topic.id,
        language,
        {
          onAudioDelta: (chunk) => player.pushChunk(chunk),
          onDone: (result) => {
            player.finish()
            resolve({ status: 'done', sessionId: result.sessionId })
          },
          onError: () => {
            player.cancel()
            resolve({ status: 'error' })
          },
        },
        subtopics,
      )
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

  function handleDrawerStart(topic: InterviewTopic, subtopics: Array<string>) {
    setCustomizingTopic(null)
    void handleSelect(topic, subtopics)
  }

  return (
    <div className="mx-auto w-full pb-8">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="type-h4 font-semibold text-foreground">
          Practice Interviews
        </h1>
        <LectureAiChatLanguagePicker
          value={language}
          onChange={handleLanguageChange}
          disabled={creatingTopicId !== null}
          languages={INTERVIEW_LANGUAGES}
        />
      </div>
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
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1">
            {data.curriculumTopics.length > 0 ? (
              <div className="mb-8">
                <h2 className="type-b2-md mb-2 font-semibold text-foreground-muted">
                  Continue your coursework
                </h2>
                <div className="flex flex-col gap-3">
                  {data.curriculumTopics.map((topic) => (
                    <CourseworkHighlight
                      key={topic.id}
                      topic={topic}
                      isDisabled={creatingTopicId !== null}
                      onSelect={() => void handleSelect(topic)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {data.catalogTopics.length > 0 ? (
              <div>
                <h2 className="type-b2-md mb-2 font-semibold text-foreground-muted">
                  Topics for your program
                </h2>
                <div
                  data-testid="interview-topic-grid"
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {data.catalogTopics.map((topic, index) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      accentIndex={index}
                      isSelected={creatingTopicId === topic.id}
                      isDisabled={creatingTopicId !== null}
                      onSelect={() => void handleSelect(topic)}
                      onCustomize={() => setCustomizingTopic(topic)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <SessionsRail />
        </div>
      ) : null}

      <SubtopicDrawer
        topic={customizingTopic}
        open={customizingTopic !== null}
        onOpenChange={(open) => {
          if (!open) setCustomizingTopic(null)
        }}
        isStarting={creatingTopicId !== null}
        onStart={handleDrawerStart}
      />
    </div>
  )
}
