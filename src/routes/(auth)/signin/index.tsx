import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAddAccountIntent } from '@/components/features/sign-in/signInRouting'
import { SignInFlow } from '@/components/features/sign-in/SignInFlow'
import { SignInShell } from '@/components/features/sign-in/SignInShell'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'

export const Route = createFileRoute('/(auth)/signin/')({
  beforeLoad: async ({ location }) => {
    const url = new URL(location.href, 'http://localhost')
    // Add-account: an already-authenticated browser is allowed to reach the
    // sign-in form (to link a second account) instead of bouncing home.
    if (isAddAccountIntent(url.search)) return

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
