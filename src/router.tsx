import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AppLoading } from '@/components/common'

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {
      user: null,
      login: () => { },
      logout: () => { },
    },
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
    // Avoid transient not-found flashes during fast redirects/normalization.
    defaultPendingMs: 120,
    defaultPendingMinMs: 300,
    defaultPendingComponent: () => <AppLoading fullPage label="Loading..." />,
    defaultNotFoundComponent: () => <AppLoading fullPage label="Resolving route..." />,
  })

  return router
}