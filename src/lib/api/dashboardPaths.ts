export const SERVER_TIME_API = '/api/server-time'

export const DASHBOARD_API = {
  overview: '/api/dashboard/overview',
  navbarPill: '/api/dashboard/navbar-pill',
  npsForm: (formId: number) => `/api/dashboard/nps-form/${formId}`,
  npsFormStart: (formId: number) => `/api/dashboard/nps-form/${formId}/start`,
  npsFormResponse: (formId: number) => `/api/dashboard/nps-form/${formId}/response`,
  npsFormComplete: (formId: number) => `/api/dashboard/nps-form/${formId}/complete`,
  agreement: (sectionId: number) => `/api/dashboard/agreement/${sectionId}`,
  agreementOpen: (sectionId: number) => `/api/dashboard/agreement/${sectionId}/open`,
  agreementStep: (sectionId: number) => `/api/dashboard/agreement/${sectionId}/step`,
  assessNpsLink: (formId: number) => `/api/dashboard/assess-nps/${formId}/link`,
  agreementDetails: (sectionId: number) => `/api/dashboard/agreement/${sectionId}/details`,
  agreementSubmit: (sectionId: number) => `/api/dashboard/agreement/${sectionId}/submit`,
  agreementDismiss: (sectionId: number) => `/api/dashboard/agreement/${sectionId}/dismiss`,
  t0FlowStatus: '/api/dashboard/t0-flow-status',
  t0FlowLectures: '/api/dashboard/t0-flow-lectures',
  t0FlowStepComplete: '/api/dashboard/t0-flow-step-complete',
  t0FlowStudentStatus: '/api/dashboard/t0-flow-student-status',
  welcomeModalStatus: '/api/dashboard/welcome-modal-status',
  welcomeModalDismiss: '/api/dashboard/welcome-modal-dismiss',
  paymentBanner: '/api/dashboard/payment-banner',
} as const
