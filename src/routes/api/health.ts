import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `OK. AuthCookieName: ${process.env.COOKIE_NAME}. Old URI:${process.env.VITE_OLD_STUDENT_UI_URL}`,
        ),
    },
  },
})
