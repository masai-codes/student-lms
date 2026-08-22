import { useEffect, useMemo, useState } from 'react'
import { LoaderCircleIcon, SearchIcon } from 'lucide-react'
import type { InterviewTopic } from '@/server/api/interviews/types/interviewSession'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import BottomDrawer from '@/components/ui/bottom-drawer'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import { getTopicIcon } from './topicIcons'
import { cn } from '@/lib/utils'

/** Above this many subtopics a plain chip cloud gets unwieldy, so a filter
 * input is worth the extra chrome. */
const FILTER_THRESHOLD = 8

function SubtopicToggle({
  label,
  isSelected,
  onToggle,
}: {
  label: string
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onToggle}
      className={cn(
        'type-b3-md rounded-full border px-3 py-1.5 text-left transition-colors',
        isSelected
          ? 'border-brand bg-brand text-brand-foreground'
          : 'border-border bg-surface text-foreground-muted hover:bg-surface-muted',
      )}
    >
      {label}
    </button>
  )
}

function StartButton({
  isStarting,
  onClick,
  className,
}: {
  isStarting: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      data-testid="interview-subtopic-drawer-start"
      disabled={isStarting}
      onClick={onClick}
      className={cn(
        'type-b1-md flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60',
        className,
      )}
    >
      {isStarting ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
      Start interview
    </button>
  )
}

function SubtopicPickerFields({
  topic,
  selected,
  filter,
  onFilterChange,
  onToggle,
  onSelectAll,
  onClear,
}: {
  topic: InterviewTopic
  selected: Set<string>
  filter: string
  onFilterChange: (value: string) => void
  onToggle: (subtopic: string) => void
  onSelectAll: () => void
  onClear: () => void
}) {
  const visibleSubtopics = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return topic.subtopics
    return topic.subtopics.filter((subtopic) =>
      subtopic.toLowerCase().includes(query),
    )
  }, [topic, filter])

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="type-b3-md text-foreground-muted">
          {selected.size} of {topic.subtopics.length} selected
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            className="type-b3-md text-brand hover:underline"
            onClick={onSelectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="type-b3-md text-foreground-muted hover:underline"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>

      {topic.subtopics.length > FILTER_THRESHOLD ? (
        <div className="relative mb-3">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
          <input
            type="text"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder="Filter subtopics"
            className="type-b2-regular w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-foreground outline-none focus-visible:border-brand"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pb-4">
        {visibleSubtopics.map((subtopic) => (
          <SubtopicToggle
            key={subtopic}
            label={subtopic}
            isSelected={selected.has(subtopic)}
            onToggle={() => onToggle(subtopic)}
          />
        ))}
        {visibleSubtopics.length === 0 ? (
          <p className="type-b3-md text-foreground-muted">
            No subtopics match "{filter}".
          </p>
        ) : null}
      </div>
    </>
  )
}

export function SubtopicDrawer({
  topic,
  open,
  onOpenChange,
  isStarting,
  onStart,
}: {
  topic: InterviewTopic | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isStarting: boolean
  onStart: (topic: InterviewTopic, subtopics: Array<string>) => void
}) {
  const isMobile = useIsMobileViewport()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (topic) {
      setSelected(new Set(topic.subtopics))
      setFilter('')
    }
  }, [topic])

  if (!topic) return null

  const Icon = getTopicIcon(topic.iconKey)

  function toggle(subtopic: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(subtopic)) next.delete(subtopic)
      else next.add(subtopic)
      return next
    })
  }

  const fieldsProps = {
    topic,
    selected,
    filter,
    onFilterChange: setFilter,
    onToggle: toggle,
    onSelectAll: () => setSelected(new Set(topic.subtopics)),
    onClear: () => setSelected(new Set()),
  }

  // Vaul's swipe-to-dismiss physics are set by `Drawer.Root`'s own `direction`
  // prop, not CSS — a CSS-only responsive Sheet can't become a real bottom
  // sheet at small widths, so mobile gets the app's dedicated `BottomDrawer`
  // (correctly layered above the fixed mobile tab bar) instead.
  if (isMobile) {
    return (
      <BottomDrawer
        open={open}
        onClose={() => onOpenChange(false)}
        title={topic.label}
        testId="interview-subtopic-drawer"
        bodyClassName="flex flex-col"
      >
        <SubtopicPickerFields {...fieldsProps} />
        <div className="sticky bottom-0 -mx-5 mt-1 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <StartButton
            isStarting={isStarting}
            onClick={() => onStart(topic, Array.from(selected))}
          />
        </div>
      </BottomDrawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md"
        data-testid="interview-subtopic-drawer"
      >
        <SheetHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground"
              aria-hidden
            >
              <Icon className="size-4" />
            </span>
            <div>
              <SheetTitle className="type-h6">{topic.label}</SheetTitle>
              <SheetDescription>Choose what to focus on</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <SubtopicPickerFields {...fieldsProps} />
        </div>

        <SheetFooter className="border-t border-border">
          <StartButton
            isStarting={isStarting}
            onClick={() => onStart(topic, Array.from(selected))}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
