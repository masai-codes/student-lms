

export interface User {
  id: number
  name: string
  email?: string | null
  mobile?: string | null
  /** Resolved avatar URL (profiles / users meta or `profile_photo_path`). */
  profileImageUrl?: string | null
  joinedClubId?: string | null
}

export interface RouterContext {
  user: User | null,
  login: (user: User) => void,
  logout: () => void
}

export type Course = {
  id: string
  title: string
  org: string
  progress: number
  cta: "resume" | "start"
  image: string
}

export type Lecture = {
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

export type CardStatus = 'completed' | 'in-progress' | 'warning'