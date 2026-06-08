import { useState } from 'react'
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import appCss from '../styles.css?url'
import type { RouterContext } from '@/types'
import { captureAppMobileContextFromUrl } from '@/utils/appMobile'
import { installAppOriginFetchHeader } from '@/utils/appOrigin'
import { getAuthBranding } from '@/utils/authBranding'

const GA_MEASUREMENT_ID = 'G-R3MQZK6LM6'

captureAppMobileContextFromUrl()
installAppOriginFetchHeader()


export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: getAuthBranding().pageTitle,
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap',
      },
      {
        rel: 'icon',
        href: 'https://d27028dliefpk3.cloudfront.net/assets/favicon/favicon.ico',
      },
      {
        rel: 'apple-touch-icon',
        href: 'https://d27028dliefpk3.cloudfront.net/assets/favicon/favicon.ico',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // Must be a stable instance: creating the client inline on every render would
  // hand `QueryClientProvider` a brand-new, empty cache whenever this shell
  // re-renders, silently discarding every cached query and optimistic write
  // (e.g. a club's `isJoined` / `memberCount` after Join). `useState` keeps one
  // client for the life of the browser tab while still giving each SSR request
  // its own.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`,
          }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ duration: 4000 }}
          />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
