import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignInFlow } from '@/components/features/sign-in/SignInFlow'
import { SignInShell } from '@/components/features/sign-in/SignInShell'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'

export const Route = createFileRoute('/(auth)/signin/')({
  beforeLoad: async () => {
    const user = await fetchCurrentUser()
    if (user) {
      throw redirect({ to: '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SignInShell>
      <SignInFlow />
    </SignInShell>
  )
}
