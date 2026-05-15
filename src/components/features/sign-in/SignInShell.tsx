import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  widthClassName?: string
}

export function SignInShell({ children, widthClassName = 'sm:max-w-lg' }: Props) {
  return (
    <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-[#f8fafc] px-4 py-8 md:min-h-screen md:px-6 md:py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.08),_transparent_28%)]"
        aria-hidden
      />
      <div className="relative z-50 px-2 sm:px-0">
        <div className={cn('sm:mx-auto sm:w-full', widthClassName)}>
          <Link to="/signin" className="mx-auto block w-fit rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <img
              className="mx-auto h-10 w-auto cursor-pointer md:h-11"
              src="/masai-logo.svg"
              alt="Masai School"
            />
          </Link>
        </div>

        <div
          className={cn(
            'mt-6 rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:mx-2 md:mx-auto md:w-full',
            widthClassName,
          )}
        >
          <div className="px-5 py-8 md:px-12 md:py-10">{children}</div>
        </div>
      </div>

      <footer className="relative z-50 mt-10 bg-transparent">
        <div className="w-full text-center">
          <div className="mb-4 flex w-full items-center justify-center">
            <nav className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground md:text-sm">
              <a
                href="https://www.masaischool.com/privacy-policy"
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.masaischool.com/terms/"
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                Terms and Conditions
              </a>
            </nav>
          </div>
          <p className="text-xs text-muted-foreground md:text-sm">
            © 2026 by{' '}
            <a
              href="https://masaischool.com/"
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              target="_blank"
              rel="noreferrer noopener"
            >
              Masai School
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
