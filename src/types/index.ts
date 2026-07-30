export interface User {
  id: number
  name: string
  email?: string | null
  mobile?: string | null
  role?: string | null
  /** Resolved avatar URL (profiles / users meta or `profile_photo_path`). */
  profileImageUrl?: string | null
  joinedClubId?: string | null
}

export interface RouterContext {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

export type AppPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}
