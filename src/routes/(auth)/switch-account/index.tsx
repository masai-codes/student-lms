import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignInShell } from '@/components/features/sign-in/SignInShell'
import { SwitchAccountFlow } from '@/components/features/sign-in/SwitchAccountFlow'
import { meQuery } from '@/query/me/meQuery'

export const Route = createFileRoute('/(auth)/switch-account/')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(meQuery())
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
