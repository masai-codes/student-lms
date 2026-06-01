import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export type LoginWithPasswordInput = {
  email: string
  password: string
}

export type AuthenticatedUser = {
  id: number
  name: string
  email: string
  mobile: string | null
  role: string | null
  client: string
}

export class LoginError extends Error {
  constructor(
    public code: 'USER_NOT_FOUND' | 'PASSWORD_RESET_REQUIRED' | 'INCORRECT_CREDENTIALS',
    message: string,
  ) {
    super(message)
  }
}

export async function loginWithPassword({
  email,
  password,
}: LoginWithPasswordInput): Promise<AuthenticatedUser> {
  const normalizedEmail = email.trim().toLowerCase()

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      role: users.role,
      client: users.client,
      password: users.password,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  const user = rows[0]
  if (!user) {
    throw new LoginError('USER_NOT_FOUND', 'User not found')
  }

  if (!user.password || user.password.trim() === '') {
    throw new LoginError(
      'PASSWORD_RESET_REQUIRED',
      `It's been a while since you changed your password, please reset your password by clicking on "Forgot password"`,
    )
  }

  const match = await compare(password, user.password.trim())
  if (!match) {
    throw new LoginError('INCORRECT_CREDENTIALS', 'Incorrect credentials')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    client: user.client,
  }
}
