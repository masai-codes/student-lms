import { createFileRoute } from '@tanstack/react-router'
import { ProfileSettingsPage } from '@/components/features/profile-settings/ProfileSettingsPage'

export const Route = createFileRoute('/(protected)/_layout/profile-settings')({
  component: ProfileSettingsPage,
})
