import { createFileRoute } from '@tanstack/react-router'
import LeaderboardPage from '@/components/features/masaiverse-v2/pages/LeaderboardPage'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/leaderboard',
)({
  component: LeaderboardPage,
})
