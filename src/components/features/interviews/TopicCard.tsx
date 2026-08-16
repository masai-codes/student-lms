import { LoaderCircleIcon, SlidersHorizontalIcon } from 'lucide-react'
import type { InterviewTopic } from '@/server/api/interviews/types/interviewSession'
import { getTopicIcon } from './topicIcons'
import { getTopicAccentClassName } from './topicAccentColors'
import { cn } from '@/lib/utils'

const SUBTOPIC_PREVIEW_COUNT = 2

function SubtopicPreview({
  subtopics,
  isDisabled,
  onCustomize,
}: {
  subtopics: Array<string>
  isDisabled: boolean
  onCustomize: () => void
}) {
  if (subtopics.length === 0) return null

  const preview = subtopics.slice(0, SUBTOPIC_PREVIEW_COUNT).join(' · ')
  const remaining = subtopics.length - SUBTOPIC_PREVIEW_COUNT

  return (
    <button
      type="button"
      data-testid="interview-topic-customize"
      disabled={isDisabled}
      onClick={(event) => {
        event.stopPropagation()
        onCustomize()
      }}
      className="mt-2 flex w-full min-w-0 items-center gap-1.5 text-left text-foreground-subtle transition-colors hover:text-brand disabled:pointer-events-none disabled:opacity-60"
    >
      <SlidersHorizontalIcon className="size-3 shrink-0" />
      <span className="type-caption min-w-0 flex-1 truncate">
        {preview}
        {remaining > 0 ? ` +${remaining} more` : ''} · Customize
      </span>
    </button>
  )
}

export function TopicCard({
  topic,
  accentIndex,
  isSelected,
  isDisabled,
  onSelect,
  onCustomize,
}: {
  topic: InterviewTopic
  accentIndex: number
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
  onCustomize: () => void
}) {
  const Icon = getTopicIcon(topic.iconKey)
  const accentClassName = getTopicAccentClassName(accentIndex)

  return (
    <button
      type="button"
      data-testid="interview-topic-item"
      data-topic-id={topic.id}
      onClick={onSelect}
      disabled={isDisabled}
      aria-pressed={isSelected}
      className={cn(
        'flex h-full flex-col items-start rounded-2xl border p-4 text-left transition-colors disabled:opacity-60',
        isSelected
          ? 'border-brand bg-brand/5'
          : 'border-border bg-surface hover:bg-surface-muted',
      )}
    >
      <span
        className={cn(
          'relative flex size-10 shrink-0 items-center justify-center rounded-full',
          isSelected ? 'bg-brand text-brand-foreground' : accentClassName,
        )}
        aria-hidden
      >
        <Icon className={cn('size-4', isSelected && 'opacity-25')} />
        {isSelected ? (
          <LoaderCircleIcon className="absolute size-5 animate-spin" />
        ) : null}
      </span>
      <span className="type-b1-md mt-3 block w-full font-medium text-foreground">
        {topic.label}
      </span>
      <span className="type-b3-regular line-clamp-2 mt-0.5 block w-full text-foreground-muted">
        {topic.blurb}
      </span>
      <SubtopicPreview
        subtopics={topic.subtopics}
        isDisabled={isDisabled}
        onCustomize={onCustomize}
      />
    </button>
  )
}
