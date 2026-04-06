import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

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
    defaultPendingMs: 0,
    // defaultPendingMinMs: 1000
    defaultNotFoundComponent: () => (
      <div className="flex items-center justify-center">
        <h1 className="text-xl font-semibold">404 – URL doesn't exists</h1>
      </div>
    ),
  })

  return router
}