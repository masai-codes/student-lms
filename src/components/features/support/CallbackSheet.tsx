import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle, Phone } from '@phosphor-icons/react'

import type { CallbackOption } from '@/server/api/support/support.types'
import BottomDrawer from '@/components/ui/bottom-drawer'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ApiClientError } from '@/lib/api/apiClientError'
import { createSupportCallback } from '@/lib/api/support/supportApi'

/**
 * CallbackSheet — the "request a callback" stepper.
 *
 * Pick a reason → pick a time slot → confirm. A duplicate pending request for
 * the batch (409) is shown inline rather than failing silently. On success it
 * swaps to a confirmation with the chosen window — setting expectations.
 */
export function CallbackSheet({
  open,
  onClose,
  batchId,
  reasons,
  timeslots,
}: {
  open: boolean
  onClose: () => void
  batchId: number
  reasons: Array<CallbackOption>
  timeslots: Array<CallbackOption>
}) {
  const [reason, setReason] = useState('')
  const [slot, setSlot] = useState('')
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      createSupportCallback({ batchId, category: reason, preferredTimeSlot: slot || null }),
    onSuccess: () => setDone(true),
  })

  const isDuplicate =
    mutation.error instanceof ApiClientError && mutation.error.status === 409

  const close = () => {
    onClose()
    // Reset after the close animation so reopening starts fresh.
    setTimeout(() => {
      setReason('')
      setSlot('')
      setDone(false)
      mutation.reset()
    }, 250)
  }

  return (
    <BottomDrawer open={open} onClose={close} title="Request a callback">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle className="size-12 text-emerald-500" weight="fill" />
          <div>
            <p className="font-semibold text-foreground">You’re all set!</p>
            <p className="text-sm text-muted-foreground">
              We’ll call you back{slot ? ` in your ${slot} window` : ' soon'}.
            </p>
          </div>
          <Button className="w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-5 pb-2">
          <Section title="What’s it about?">
            <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
              {reasons.map((r) => (
                <OptionRow key={r.id} id={`reason-${r.id}`} value={r.value} checked={reason === r.value} label={r.value} />
              ))}
            </RadioGroup>
          </Section>

          {timeslots.length > 0 && (
            <Section title="Preferred time">
              <RadioGroup value={slot} onValueChange={setSlot} className="gap-2">
                {timeslots.map((t) => (
                  <OptionRow key={t.id} id={`slot-${t.id}`} value={t.value} checked={slot === t.value} label={t.value} />
                ))}
              </RadioGroup>
            </Section>
          )}

          {isDuplicate && (
            <p className="text-sm text-amber-600">
              You already have a pending callback for this batch.
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!reason || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Phone className="size-4" weight="fill" />
            {mutation.isPending ? 'Requesting…' : 'Request callback'}
          </Button>
        </div>
      )}
    </BottomDrawer>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  )
}

function OptionRow({
  id,
  value,
  checked,
  label,
}: {
  id: string
  value: string
  checked: boolean
  label: string
}) {
  return (
    <Label
      htmlFor={id}
      className={[
        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm',
        checked ? 'border-primary bg-primary/5' : 'border-border',
      ].join(' ')}
    >
      <RadioGroupItem id={id} value={value} />
      <span className="capitalize text-foreground">{label}</span>
    </Label>
  )
}
