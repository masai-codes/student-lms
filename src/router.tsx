import { createRouter, Link } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AppLoading } from '@/components/common'
import { Button } from './components/ui/button'

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {
      user: null,
      login: () => {},
      logout: () => {},
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Avoid transient not-found flashes during fast redirects/normalization.
    defaultPendingMs: 120,
    defaultPendingMinMs: 300,
    defaultPendingComponent: () => <AppLoading fullPage label="Loading..." />,
    defaultNotFoundComponent: () => (
      <div className="m-4 text-center"><div className="mb-2">Page Not Found!</div><div><Link to="/"><Button>Go to home</Button></Link></div></div>
    ),
  })

  return router
}
