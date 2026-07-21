import { toast as sonnerToast } from 'sonner'

/**
 * Reusable toast utility — wraps sonner with app-consistent defaults.
 *
 * Usage:
 *   import { toast } from '@/lib/toast'
 *
 *   toast.success('Profile updated!')
 *   toast.error('Something went wrong.')
 *   toast.info('Session starting soon.')
 *   toast.warning('Please verify your email.')
 *   toast.loading('Saving…')          // returns an id
 *   toast.dismiss(id)                  // dismiss a specific toast
 *   toast.dismiss()                    // dismiss all
 */
export const toast = {
  success: (message: string) => sonnerToast.success(message),

  error: (message: string) => sonnerToast.error(message),

  info: (message: string) => sonnerToast.info(message),

  warning: (message: string) => sonnerToast.warning(message),

  loading: (message: string) => sonnerToast.loading(message),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  /** Replaces an existing toast (e.g. swap loading → success) */
  promise: sonnerToast.promise,
}
