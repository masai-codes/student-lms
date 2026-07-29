import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignInFlow } from '@/components/features/sign-in/SignInFlow'
import { SignInShell } from '@/components/features/sign-in/SignInShell'
import { meQuery } from '@/query/me/meQuery'

export const Route = createFileRoute('/(auth)/signin/')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQuery())
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
