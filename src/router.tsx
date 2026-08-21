import { createRouter, Link } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'
import { AppError, AppLoading } from '@/components/common'
import { Button } from './components/ui/button'

export const getRouter = () => {
  // One client per router, and `getRouter()` runs per SSR request, so server
  // renders never share a cache. Routes read it from context (see `RouterContext`)
  // so `beforeLoad`/loaders can prime and reuse queries — e.g. the current user,
  // which would otherwise be refetched on every navigation (issue #354).
  const queryClient = new QueryClient()

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
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
    // Without this, Router falls back to its built-in `ErrorComponent`, which
    // prints the raw `error.message` + stack on the page — so a DB outage would
    // show students MySQL internals. Routes with their own `errorComponent`
    // (e.g. the learn detail pages) still take precedence over this default.
    defaultErrorComponent: AppError,
    defaultNotFoundComponent: () => (
      <div className="m-4 text-center">
        <div className="mb-2">Page Not Found!</div>
        <div>
          <Link to="/">
            <Button>Go to home</Button>
          </Link>
        </div>
      </div>
    ),
  })

  // Streams queries resolved during SSR into the HTML and hydrates them into
  // this client on the browser, so a query primed on the server is not refetched
  // after hydration. Also installs the `QueryClientProvider` (via the router's
  // `Wrap`), which is why the root shell no longer creates one.
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}
