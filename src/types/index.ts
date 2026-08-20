import type { QueryClient } from '@tanstack/react-query'

interface User {
  id: number
  name: string
  email?: string | null
  mobile?: string | null
  role?: string | null
  /** Resolved avatar URL (profiles / users meta or `profile_photo_path`). */
  profileImageUrl?: string | null
}

export interface RouterContext {
  /** Per-request/per-tab cache, so `beforeLoad` and loaders can prime and reuse queries. */
  queryClient: QueryClient
  user: User | null
  login: (user: User) => void
  logout: () => void
}

type Course = {
  id: string
  title: string
  org: string
  progress: number
  cta: 'resume' | 'start'
  image: string
}

type Lecture = {
  id: number
  title: string
  author: string
  dateRange: string
  completionStatus: 'completed' | 'in-progress' | 'warning'
}

export type AppPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type CardStatus = 'completed' | 'in-progress' | 'warning'
