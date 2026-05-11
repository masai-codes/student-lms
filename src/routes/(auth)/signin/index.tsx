import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'

export const Route = createFileRoute('/(auth)/signin/')({
  beforeLoad: async () => {
    const user = await fetchCurrentUser()
    if (user) {
      throw redirect({ to: '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-white py-6 md:min-h-screen md:py-12">
      <img
        src="/auth-bg-pattern.svg"
        alt=""
        width={1308}
        height={800}
        className="pointer-events-none absolute top-1/2 left-1/2 h-screen w-full max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
        aria-hidden
      />

      <div className="relative z-50 px-2 sm:px-0">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/signin" className="mx-auto block w-fit">
            <img
              className="mx-auto h-12 w-auto cursor-pointer"
              src="/masai-logo.svg"
              alt="Masai School"
            />
          </Link>
        </div>

        <div className="mt-8 bg-white sm:mx-2 md:mx-auto md:w-full md:max-w-md md:rounded-lg md:border md:border-gray-200 md:shadow-xl">
          <div className="py-8 px-4 md:rounded-lg md:px-10">
            <div className="mx-auto text-center">
              <h1 className="font-poppins text-2xl font-bold text-gray-900">Sign In</h1>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-50 mt-12 bg-transparent">
        <div className="w-full text-center">
          <div className="mb-6 flex w-full items-center justify-center">
            <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <a
                href="https://www.masaischool.com/privacy-policy"
                className="hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.masaischool.com/terms/"
                className="hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                Terms and Conditions
              </a>
            </nav>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            © 2026 by{' '}
            <a
              href="https://masaischool.com/"
              className="hover:underline"
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
