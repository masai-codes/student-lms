import { Label } from '@/components/ui/label'

type Props = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
}

export function RememberMeField({
  checked,
  onCheckedChange,
  id = 'signin-remember-me',
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="size-4 shrink-0 rounded border border-input accent-primary"
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm font-normal text-muted-foreground"
      >
        Remember me
      </Label>
    </div>
  )
}
