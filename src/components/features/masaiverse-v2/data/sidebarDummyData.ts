import type { MasaiverseV2SidebarData } from '../types'

/**
 * Dummy sidebar data, shaped exactly like the eventual
 * GET `/api/masaiverse-v2/home` response. During API integration, replace
 * this constant with the fetched response — the components consuming it stay
 * unchanged.
 */
export const SIDEBAR_DUMMY_DATA: MasaiverseV2SidebarData = {
  eventsCount: 2,
  myClubs: [
    { id: 'programming-club', name: 'Programming Club', icon: '💻' },
    { id: 'design-circle', name: 'Design Circle', icon: '🎨' },
    { id: 'data-ai-guild', name: 'Data & AI Guild', icon: '📊' },
  ],
}
