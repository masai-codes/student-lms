// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'
import type { AnnouncementDetail } from '@/server/api/announcement/getAnnouncementById.service'
import { MessageDetailPage } from './MessageDetailPage'
import { ThemeProvider } from '@/lib/theme'

const hoisted = vi.hoisted(() => ({
  recorderState: {
    state: 'idle',
    seconds: 0,
    audioBlob: null as Blob | null,
    permissionDenied: false,
    isPlaying: false,
    waveformRef: { current: null },
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    discardRecording: vi.fn(),
    togglePlayback: vi.fn(),
  },
}))

vi.mock('@/hooks/useInterviewRecorder', () => ({
  useInterviewRecorder: () => hoisted.recorderState,
}))

vi.mock('@/lib/api/announcement/announcementApi', () => ({
  markMessageRead: vi.fn(async () => {}),
  markMessageUnread: vi.fn(async () => {}),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useRouter: () => ({ invalidate: vi.fn() }),
  }
})

const baseDetail: AnnouncementDetail = {
  id: '42',
  source: 'm',
  title: 'Hi',
  body: '',
  authorName: 'Ada',
  scheduledAt: '2026-07-20T10:00:00.000Z',
  category: 'general',
  tags: null,
  isForYou: false,
  trackRead: true,
  isBookmarked: false,
  bookmarkId: null,
  type: null,
  ctaName: null,
  ctaLink: null,
  from: 'Ada Instructor',
  isRead: true,
  thread: [],
}

function renderPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {/* MessageDetailPage themes its MDEditor via useTheme. */}
      <ThemeProvider>
        <MessageDetailPage detail={baseDetail} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  hoisted.recorderState.state = 'idle'
  hoisted.recorderState.audioBlob = null
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ url: 'https://cdn.example.com/voice_note.wav' }),
      }),
    ),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('MessageDetailPage voice note recording', () => {
  it('starts a recording when the mic button is clicked', () => {
    renderPage()
    fireEvent.click(screen.getByLabelText('Start voice recording'))
    expect(hoisted.recorderState.startRecording).toHaveBeenCalled()
  })

  it('uploads the recorded blob and clears the recording on save', async () => {
    hoisted.recorderState.state = 'recorded'
    hoisted.recorderState.audioBlob = new Blob(['x'], { type: 'audio/wav' })
    renderPage()

    fireEvent.click(screen.getByLabelText('Save recording'))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/message/upload',
        expect.objectContaining({ method: 'POST' }),
      ),
    )
    await waitFor(() =>
      expect(hoisted.recorderState.discardRecording).toHaveBeenCalled(),
    )
  })

  it('discards the recording without uploading', () => {
    hoisted.recorderState.state = 'recorded'
    hoisted.recorderState.audioBlob = new Blob(['x'], { type: 'audio/wav' })
    renderPage()

    fireEvent.click(screen.getByLabelText('Discard recording'))
    expect(hoisted.recorderState.discardRecording).toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
})
