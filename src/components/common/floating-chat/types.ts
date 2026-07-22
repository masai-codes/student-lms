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
  /** Lecture kind from learn listing (`live` / `video`). */
  type?: 'live' | 'video'
  startTime?: string
  /** True for recommended/optional assignments (and similar learn items). */
  isOptional?: boolean
}

export interface Message {
  role: 'user' | 'bot' | 'agent'
  text: string
  name?: string
  /** The templated acknowledgement sent right after a ticket is raised. */
  isAutoReply?: boolean
  /** ISO timestamp from `comments.created_at` (or the ticket row for the opening message). */
  createdAt?: string | null
}

export type TicketFilter = 'all' | 'open' | 're-opened' | 'resolved'

export type FloatingChatView = 'home' | 'tickets' | 'oneOnOne'
