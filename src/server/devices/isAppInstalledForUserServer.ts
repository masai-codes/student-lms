import { createServerFn } from '@tanstack/react-start'

export const isAppInstalledForUserServer = createServerFn({ method: 'GET' })
  .validator((data: { userId: number }) => data)
  .handler(async ({ data }): Promise<boolean> => {
    const { isAppInstalledForUser } = await import('./isAppInstalledForUser')
    return isAppInstalledForUser(data.userId)
  })
