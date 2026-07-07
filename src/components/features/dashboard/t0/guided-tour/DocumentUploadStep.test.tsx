// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentUploadStep } from './DocumentUploadStep'

const hoisted = vi.hoisted(() => ({ fetchDocs: vi.fn() }))
vi.mock('@/lib/api/dashboard/dashboardApi', () => ({ fetchT0FlowDocuments: hoisted.fetchDocs }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => vi.stubGlobal('open', vi.fn()))

function renderStep(onCompleted = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <DocumentUploadStep batchId={5} onCompleted={onCompleted} />
    </QueryClientProvider>,
  )
  return { onCompleted }
}

describe('DocumentUploadStep', () => {
  it('shows the done state when documents are already uploaded', async () => {
    hoisted.fetchDocs.mockResolvedValue({ documentsUploaded: true, documentsVerified: false, admissionsFormUrl: 'https://sso/docs' })
    renderStep()
    await waitFor(() => expect(screen.getByTestId('document-upload-done')).toBeTruthy())
    expect(hoisted.fetchDocs).toHaveBeenCalledWith(5)
  })

  it('redirects to the admissions portal and refetches when not uploaded', async () => {
    hoisted.fetchDocs.mockResolvedValue({ documentsUploaded: false, documentsVerified: false, admissionsFormUrl: 'https://sso/docs' })
    const { onCompleted } = renderStep()
    await waitFor(() => expect(screen.getByTestId('document-upload-continue')).toBeTruthy())
    fireEvent.click(screen.getByTestId('document-upload-continue'))
    expect(window.open).toHaveBeenCalledWith('https://sso/docs', '_blank', 'noopener,noreferrer')
    expect(onCompleted).toHaveBeenCalled()
  })
})
