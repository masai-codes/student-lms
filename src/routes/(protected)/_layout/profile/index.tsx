import { createFileRoute } from '@tanstack/react-router'

/**
 * Blank slate — the profile page (UI + APIs) was removed and will be rebuilt.
 * The route itself is kept because nav items and the mobile tab bar link here.
 */
export const Route = createFileRoute('/(protected)/_layout/profile/')({
  validateSearch: (raw): { tab?: string } => ({
    tab: typeof raw.tab === 'string' ? raw.tab : undefined,
  }),
  component: ProfilePage,
})

function ProfilePage() {
  return <div className="mx-4 mb-6 mt-4 md:mx-8" />
}
