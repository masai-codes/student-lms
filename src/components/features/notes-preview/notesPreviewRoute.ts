import { getRouteApi } from '@tanstack/react-router'

/**
 * Shared handle to the standalone `/notes-preview-v2` route so the WebView
 * component can read its search params without prop-drilling. Reading params
 * this way lets the page re-render when `entityId`/`category`/`contentType`
 * change via client-side navigation, without a full page reload.
 */
export const notesPreviewRouteApi = getRouteApi('/notes-preview-v2')

/** Validated shape of the `/notes-preview-v2` search params. */
export type NotesPreviewSearch = {
  token?: string
  category?: string
  contentType?: string
  entityId?: string
}
