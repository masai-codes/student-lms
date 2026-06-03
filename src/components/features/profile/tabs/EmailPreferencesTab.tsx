import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Modal, ModalContent, ModalPortal, ModalOverlay } from '@/components/ui/modal'
import { fetchEmailPreferences, updateEmailPreferences } from '@/lib/api/profile/profileApi'
import type { EmailPreferences } from '@/server/api/profile/emailPreferences.service'

// ── Toggle ────────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${
        checked ? 'bg-[#4B44A8]' : 'bg-gray-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-[22px] rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PREF_LABELS: Array<{ key: keyof EmailPreferences; label: string }> = [
  { key: 'lectures', label: 'Lectures' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'evaluations', label: 'Evaluations' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'discussions', label: 'Discussions' },
]

interface PendingToggle {
  key: keyof EmailPreferences
  label: string
  newValue: boolean
}

// ── Email Preferences Tab ─────────────────────────────────────────────────────

export function EmailPreferencesTab() {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<PendingToggle | null>(null)

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['email-preferences'],
    queryFn: fetchEmailPreferences,
    staleTime: 2 * 60 * 1000,
  })

  const { mutate: savePrefs, isPending: isSaving } = useMutation({
    mutationFn: updateEmailPreferences,
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['email-preferences'] })
      const previous = queryClient.getQueryData<EmailPreferences>(['email-preferences'])
      queryClient.setQueryData<EmailPreferences>(['email-preferences'], (old) =>
        old ? { ...old, ...vars } : old
      )
      return { previous }
    },
    onSuccess: (data, vars) => {
      queryClient.setQueryData(['email-preferences'], data)
      const key = Object.keys(vars)[0] as keyof EmailPreferences
      const label = PREF_LABELS.find((p) => p.key === key)?.label ?? key
      toast.success(`${label} email notifications ${vars[key] ? 'enabled' : 'disabled'}.`)
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['email-preferences'], ctx.previous)
      toast.error('Failed to update email preference. Please try again.')
    },
  })

  function requestToggle(key: keyof EmailPreferences, label: string, newValue: boolean) {
    setPending({ key, label, newValue })
  }

  function confirmToggle() {
    if (!pending) return
    savePrefs({ [pending.key]: pending.newValue })
    setPending(null)
  }

  function cancelToggle() { setPending(null) }

  const isEnabling = pending?.newValue === true

  return (
    <>
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Email Preferences</h2>
        <p className="text-sm text-gray-500 mb-6">Choose which email notifications you want to receive.</p>

        {isLoading ? (
          <div className="flex flex-col">
            {PREF_LABELS.map(({ key }) => (
              <div key={key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                <div className="h-[26px] w-[46px] rounded-full bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {PREF_LABELS.map(({ key, label }, i) => (
              <div
                key={key}
                className={`flex items-center justify-between py-4 ${i < PREF_LABELS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="text-[15px] font-semibold text-gray-900">{label}</span>
                <Toggle checked={prefs?.[key] ?? false} onChange={(v) => requestToggle(key, label, v)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Modal open={pending !== null} onOpenChange={(open) => { if (!open) cancelToggle() }}>
        <ModalPortal>
          <ModalOverlay className="bg-black/50" />
          <ModalContent className="max-w-[420px] w-full rounded-[20px] p-8 flex flex-col items-center gap-5 shadow-xl">
            <AlertCircle size={48} strokeWidth={2} className="text-yellow-400" />
            <h2 className="text-[18px] font-bold text-gray-900 text-center leading-snug">
              {isEnabling ? 'Enable' : 'Disable'} email notifications for {pending?.label}?
            </h2>
            <p className="text-[14px] text-gray-500 text-center leading-relaxed">
              {isEnabling
                ? `You will start receiving email notifications about ${pending?.label.toLowerCase()}.`
                : `You will stop receiving email notifications about ${pending?.label.toLowerCase()}.`}
            </p>
            <div className="flex items-center justify-end gap-3 w-full mt-1">
              <button
                type="button"
                onClick={cancelToggle}
                className="px-5 py-2.5 rounded-[10px] border-2 border-blue-500 text-blue-600 text-sm font-semibold bg-white hover:bg-blue-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmToggle}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-[10px] bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors"
              >
                {isSaving ? 'Saving…' : (isEnabling ? 'Enable' : 'Disable')}
              </button>
            </div>
          </ModalContent>
        </ModalPortal>
      </Modal>
    </>
  )
}
