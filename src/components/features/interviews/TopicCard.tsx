import { EllipsisVerticalIcon, LoaderCircleIcon } from 'lucide-react'
import type { InterviewTopic } from '@/server/api/interviews/types/interviewSession'
import { getTopicIcon } from './topicIcons'
import { getTopicAccentClassName } from './topicAccentColors'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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

  return (
    <Button
      type="button"
      data-testid="interview-topic-customize"
      disabled={isDisabled}
      onClick={(event) => {
        event.stopPropagation()
        onCustomize()
      }}
      variant={'ghost'}
      size={'icon'}
      className="rounded-full"
    >
      <EllipsisVerticalIcon />
    </Button>
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
        'flex h-full flex-col items-start rounded-2xl border px-4 pt-3 pb-4 text-left transition-colors hover:bg-surface-muted/70 disabled:opacity-60 relative',
        isSelected ? 'border-brand bg-brand/5' : 'border-border bg-surface',
      )}
    >
      <div className="flex gap-2 items-center justify-between w-full mb-2">
        <div className="flex gap-2 items-center">
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
          <span className="type-b1-md block w-full font-medium text-foreground">
            {topic.label}
          </span>
        </div>
        <SubtopicPreview
          subtopics={topic.subtopics}
          isDisabled={isDisabled}
          onCustomize={onCustomize}
        />
      </div>
      <span className="type-b3-regular line-clamp-2 mt-0.5 block w-full text-foreground-muted ml-1">
        {topic.blurb}
      </span>
    </button>
  )
}
