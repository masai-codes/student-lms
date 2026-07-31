import { useState } from 'react'
import {
  Check,
  Code2,
  Database,
  LayoutTemplate,
  Network,
  Sigma,
} from 'lucide-react'

const TOPICS = [
  { id: 'dsa', label: 'Data Structures & Algorithms', icon: Sigma },
  { id: 'system-design', label: 'System Design', icon: Network },
  { id: 'frontend', label: 'Frontend Development', icon: LayoutTemplate },
  { id: 'backend', label: 'Backend Development', icon: Code2 },
  { id: 'databases', label: 'Databases', icon: Database },
]

export function InterviewsPage() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  return (
    <div className="mx-auto w-full max-w-2xl py-8">
      <h1 className="type-h4 mb-1 font-semibold text-foreground">
        Practice Interviews
      </h1>
      <p className="mb-6 text-sm text-foreground-muted">
        Pick a topic to get started.
      </p>

      <div className="flex flex-col gap-2">
        {TOPICS.map((topic) => {
          const isSelected = topic.id === selectedTopicId
          const Icon = topic.icon
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => setSelectedTopicId(topic.id)}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
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
              <span className="type-b1-md flex-1 font-medium text-foreground">
                {topic.label}
              </span>
              {isSelected ? (
                <Check className="size-5 shrink-0 text-brand" aria-hidden />
              ) : null}
            </button>
          )
        })}
      </div>

      {selectedTopicId ? (
        <p className="mt-6 text-sm text-foreground-muted">
          More coming soon for this topic.
        </p>
      ) : null}
    </div>
  )
}
