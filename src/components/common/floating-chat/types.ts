export interface Category {
  id: string
  label: string
  desc: string
  icon: any
}

export interface Item {
  id?: number
  title: string
  meta: string
  date: string
  /** Lecture kind from learn listing (`live` / `video` / `scrum`). */
  type?: 'live' | 'video' | 'scrum'
  startTime?: string
  /** True for recommended/optional assignments (and similar learn items). */
  isOptional?: boolean
  /** True for mandatory assignments and evaluations. */
  isMandatory?: boolean
  /** Module label for assignment/evaluation cards. */
  moduleName?: string
  /** Section ("Course") label — only populated when `showSectionDropdown` is on for the batch. */
  sectionName?: string
}

export interface Message {
  role: 'user' | 'bot' | 'agent'
  text: string
  name?: string
  /** The templated acknowledgement sent right after a ticket is raised. */
  isAutoReply?: boolean
  /** True when this reply was produced by the support AI agent (not a human coordinator). */
  isAi?: boolean
  /** ISO timestamp from `comments.created_at` (or the ticket row for the opening message). */
  createdAt?: string | null
}

export type TicketFilter = 'all' | 'open' | 're-opened' | 'resolved'

export type FloatingChatView = 'home' | 'tickets' | 'oneOnOne'
