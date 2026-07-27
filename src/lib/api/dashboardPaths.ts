export const SERVER_TIME_API = '/api/server-time'

export const DASHBOARD_API = {
  overview: '/api/dashboard/overview',
  pendingTasks: '/api/dashboard/pending-tasks',
  navbarPill: '/api/dashboard/navbar-pill',
  t0FlowLectures: '/api/dashboard/t0-flow-lectures',
  t0FlowDocuments: '/api/dashboard/t0-flow-documents',
  t0FlowStepComplete: '/api/dashboard/t0-flow-step-complete',
  welcomeModalDismiss: '/api/dashboard/welcome-modal-dismiss',
  profilePhoto: '/api/dashboard/profile-photo',
  agreementSave: '/api/dashboard/agreement/save',
  agreementSubmit: '/api/dashboard/agreement/submit',
  agreementView: '/api/dashboard/agreement/view',
} as const
