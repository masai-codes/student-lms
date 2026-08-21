import {
  ChatCircle,
  PlayCircle,
  CheckSquareOffset,
  BookOpen,
  CheckCircle,
} from '@phosphor-icons/react'
import type { Category } from './types'

export const CATEGORIES: Category[] = [
  {
    id: 'lecture',
    label: 'Lecture',
    desc: 'A doubt about a class or recording',
    icon: PlayCircle,
  },
  {
    id: 'assignment',
    label: 'Assignment',
    desc: 'Stuck on a problem or submission',
    icon: CheckSquareOffset,
  },
  {
    id: 'resource',
    label: 'Resource',
    desc: 'Issue with a document or reading',
    icon: BookOpen,
  },
  {
    id: 'evaluation',
    label: 'Evaluation',
    desc: 'Quiz, test or interview related',
    icon: CheckCircle,
  },
  {
    id: 'general',
    label: 'General Query',
    desc: "Anything that doesn't fit below",
    icon: ChatCircle,
  },
]
