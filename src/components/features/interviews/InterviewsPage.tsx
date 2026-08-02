import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import type { InterviewTopic } from '@/server/api/interviews/types/interviewSession'
import { createInterviewSession } from '@/lib/api/interviews/interviewsApi'
import { interviewTopicsQuery } from '@/query/interviews/interviewTopicsQuery'
import { toast } from '@/lib/toast'
import { getTopicIcon } from './topicIcons'

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
        <Icon className="size-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="type-b1-md block font-medium text-foreground">
          {topic.label}
        </span>
        <span className="block truncate text-xs text-foreground-muted">
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
    try {
      const { sessionId } = await createInterviewSession(topic.id)
      await navigate({
        to: '/interviews/$sessionId',
        params: { sessionId: String(sessionId) },
      })
    } catch {
      toast.error('Could not start the interview. Please try again.')
      setCreatingTopicId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-8">
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
        <>
          <TopicGroup
            title="Recommended for your program"
            topics={data.catalogTopics}
            creatingTopicId={creatingTopicId}
            onSelect={(topic) => void handleSelect(topic)}
          />
          <TopicGroup
            title="From your coursework"
            topics={data.curriculumTopics}
            creatingTopicId={creatingTopicId}
            onSelect={(topic) => void handleSelect(topic)}
          />
        </>
      ) : null}
    </div>
  )
}
