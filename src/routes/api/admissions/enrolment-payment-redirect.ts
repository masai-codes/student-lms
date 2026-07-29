import { createFileRoute } from '@tanstack/react-router'

import { handleEnrolmentPaymentRedirect } from '@/server/admissions/handleEnrolmentPaymentRedirect'

export const Route = createFileRoute(
  '/api/admissions/enrolment-payment-redirect',
)({
  server: {
    handlers: {
      GET: ({ request }) => handleEnrolmentPaymentRedirect(request),
    },
  },
})
