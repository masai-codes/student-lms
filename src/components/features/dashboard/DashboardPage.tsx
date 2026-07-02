import { DashboardLayout } from './layout/DashboardLayout'
import { MOCK_DASHBOARD_DATA } from './shared/mockData'

// Feature entry point. Renders the static dashboard from mock data; swap in
// API-driven data here once the endpoints are available.
export function DashboardPage() {
  return <DashboardLayout data={MOCK_DASHBOARD_DATA} />
}
