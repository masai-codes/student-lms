import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Card,
  // CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'
import { redirectToOldStudentUi } from '@/utils/authRedirect'

export const Route = createFileRoute('/(auth)/login/')({
  beforeLoad: async () => {
    const user = await fetchCurrentUser()
    if (user) {
      throw redirect({ to: '/' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const [showPassword, setShowPassword] = useState(false)
  useEffect(() => {
    redirectToOldStudentUi()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            onClick={redirectToOldStudentUi}
          >
            Go to Old LMS Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
