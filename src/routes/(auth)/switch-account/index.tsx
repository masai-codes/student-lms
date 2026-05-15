import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignInShell } from '@/components/features/sign-in/SignInShell'
import { SwitchAccountFlow } from '@/components/features/sign-in/SwitchAccountFlow'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'

export const Route = createFileRoute('/(auth)/switch-account/')({
  beforeLoad: async () => {
    const user = await fetchCurrentUser()
    if (!user) {
      throw redirect({ to: '/signin' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SignInShell widthClassName="sm:max-w-2xl md:max-w-5xl">
      <SwitchAccountFlow />
    </SignInShell>
  )
}
