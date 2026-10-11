import * as React from 'react'

import { api, attempt, type User } from '@/lib/api'

/**
 * Who is signed in. The Flask backend keeps the session in a cookie;
 * on load we ask /api/me, and sign-in / sign-up / sign-out call the API.
 */

export interface SignUpInput {
  name: string
  email: string
  password: string
  university: string
  city: string
  cf_handle: string
}

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (input: SignUpInput) => Promise<string | null>
  signOut: () => Promise<void>
  /** Re-read /api/me after something about the user changed (profile, team). */
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      setUser(await api.get<User>('/me'))
    } catch {
      setUser(null)
    }
  }, [])

  React.useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: user != null,
      signIn: (email, password) =>
        attempt(async () => setUser(await api.post<User>('/login', { email, password }))),
      signUp: (input) => attempt(async () => setUser(await api.post<User>('/signup', input))),
      signOut: async () => {
        await api.post('/logout').catch(() => {})
        setUser(null)
      },
      refresh,
    }),
    [user, loading, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** For pages inside the signed-in app, where a user always exists. */
export function useMe(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useMe called outside the signed-in app')
  return user
}
