import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export function SignInShell({ children }: Props) {
  return (
    <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-background py-6 md:min-h-screen md:py-12">
      <img
        src="/auth-bg-pattern.svg"
        alt=""
        width={1308}
        height={800}
        className="pointer-events-none absolute top-1/2 left-1/2 h-screen w-full max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-90"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background bg-center [mask-image:linear-gradient(180deg,var(--background),transparent)]"
        aria-hidden
      />

      <div className="relative z-50 px-2 sm:px-0">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/signin" className="mx-auto block w-fit rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <img
              className="mx-auto h-12 w-auto cursor-pointer"
              src="/masai-logo.svg"
              alt="Masai School"
            />
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card/95 shadow-xl ring-1 ring-border/50 backdrop-blur-sm sm:mx-2 md:mx-auto md:w-full md:max-w-md">
          <div className="py-8 px-4 md:px-10">{children}</div>
        </div>
      </div>

      <footer className="relative z-50 mt-12 bg-transparent">
        <div className="w-full text-center">
          <div className="mb-6 flex w-full items-center justify-center">
            <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
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
          <p className="mt-4 text-sm text-muted-foreground">
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
