import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, InfoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { fetchProfile, updateProfile, changePassword } from '@/lib/api/profile/profileApi'
import { ApiClientError } from '@/lib/api/apiClientError'

// ── Edit Card ─────────────────────────────────────────────────────────────────

interface EditCardProps {
  id: string
  label: string
  value: string | null
  placeholder?: string
  dimmed?: boolean
  onSave: (val: string) => Promise<void>
  onEditStart: (id: string) => void
  onEditEnd: () => void
}

function EditCard({
  id,
  label,
  value,
  placeholder,
  dimmed = false,
  onSave,
  onEditStart,
  onEditEnd,
}: EditCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setDraft(value ?? '')
    setError(null)
    setEditing(true)
    onEditStart(id)
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
    onEditEnd()
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      setEditing(false)
      onEditEnd()
      toast.success(`${label} updated successfully.`)
    } catch {
      setError('Failed to save. Please try again.')
      toast.error(`Failed to update ${label.toLowerCase()}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-[12px] border border-gray-200 bg-white p-5 transition-opacity ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[15px] font-semibold ${editing ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </span>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            disabled={dimmed}
            className="text-[13px] font-semibold text-[#6962AC] hover:underline focus-visible:outline-none disabled:pointer-events-none"
          >
            EDIT
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-[8px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save()
              if (e.key === 'Escape') cancelEdit()
            }}
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="px-4 py-2 rounded-[8px] border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="px-4 py-2 rounded-[8px] bg-[#4B44A8] text-white text-sm font-medium hover:bg-[#3d379a] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className={`text-[15px] ${value ? 'text-gray-700' : 'text-gray-400'}`}>
          {value || placeholder}
        </p>
      )}
    </div>
  )
}

// ── Password Card ─────────────────────────────────────────────────────────────

interface PasswordCardProps {
  dimmed?: boolean
  onEditStart: (id: string) => void
  onEditEnd: () => void
}

function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[14px] font-semibold text-gray-900">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}

function PasswordCard({ dimmed = false, onEditStart, onEditEnd }: PasswordCardProps) {
  const [editing, setEditing] = useState(false)
  const [current, setCurrent] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setCurrent(''); setNewPwd(''); setConfirm('')
    setError(null)
    setEditing(true)
    onEditStart('password')
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
    onEditEnd()
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await changePassword({ currentPassword: current, newPassword: newPwd, confirmPassword: confirm })
      setEditing(false)
      onEditEnd()
      toast.success('Password changed successfully.')
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to change password. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-[12px] border border-gray-200 bg-white p-5 transition-opacity ${dimmed ? 'opacity-40' : 'opacity-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[15px] font-semibold ${editing ? 'text-gray-900' : 'text-gray-500'}`}>
          Password
        </span>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            disabled={dimmed}
            className="text-[13px] font-semibold text-[#6962AC] hover:underline focus-visible:outline-none disabled:pointer-events-none"
          >
            EDIT
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-4">
          <PasswordInput label="Current Password" placeholder="Enter current password (Mandatory)" value={current} onChange={setCurrent} />
          <PasswordInput label="New Password" placeholder="Enter new password (Mandatory)" value={newPwd} onChange={setNewPwd} />
          <PasswordInput label="Confirm New Password" placeholder="Confirm new password (Mandatory)" value={confirm} onChange={setConfirm} />
          <div className="flex items-start gap-2 text-[13px] text-gray-500">
            <InfoIcon size={15} className="shrink-0 mt-0.5 text-yellow-500" />
            <span>Please note, your password must be at least 8 characters and cannot contain any space.</span>
          </div>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <div className="flex items-center gap-3">
            <button type="button" onClick={cancelEdit} disabled={saving} className="px-6 py-2.5 rounded-[10px] border-2 border-gray-800 text-sm font-semibold text-gray-800 bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={() => void save()} disabled={saving} className="px-6 py-2.5 rounded-[10px] bg-[#4B44A8] text-white text-sm font-semibold hover:bg-[#3d379a] disabled:opacity-60 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[15px] text-gray-700">••••••••</p>
      )}
    </div>
  )
}

// ── Profile Details Tab ───────────────────────────────────────────────────────

export function ProfileDetailsTab() {
  const [activeEditId, setActiveEditId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 2 * 60 * 1000,
  })

  const { mutateAsync: saveProfile } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => { queryClient.setQueryData(['profile'], updated) },
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <EditCard
        id="name"
        label="Name"
        value={profile?.name ?? null}
        placeholder="Enter your name"
        dimmed={activeEditId !== null && activeEditId !== 'name'}
        onSave={async (name) => { await saveProfile({ name }) }}
        onEditStart={setActiveEditId}
        onEditEnd={() => setActiveEditId(null)}
      />
      <EditCard
        id="phone"
        label="Phone number"
        value={profile?.mobile ?? null}
        placeholder="Enter your phone number"
        dimmed={activeEditId !== null && activeEditId !== 'phone'}
        onSave={async (mobile) => { await saveProfile({ mobile }) }}
        onEditStart={setActiveEditId}
        onEditEnd={() => setActiveEditId(null)}
      />
      <PasswordCard
        dimmed={activeEditId !== null && activeEditId !== 'password'}
        onEditStart={setActiveEditId}
        onEditEnd={() => setActiveEditId(null)}
      />
    </div>
  )
}
