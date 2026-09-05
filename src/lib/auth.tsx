import * as React from 'react'
import { currentUser, type Role, type User } from '@/lib/data'

/**
 * UI-only auth. There is no backend yet — signing in just marks a flag in
 * localStorage so the routing and role-based navigation can be demonstrated.
 */

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  role: Role
  signIn: (email?: string, role?: Role) => void
  signUp: (name: string, email: string, role: Role) => void
  signOut: () => void
  setRole: (role: Role) => void
}

const AuthContext = React.createContext<AuthState | null>(null)

const STORAGE_KEY = 'o1.auth'

interface Persisted {
  authenticated: boolean
  role: Role
  name?: string
  email?: string
}

function read(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted
      // Older builds persisted an 'admin' role that no longer exists.
      if (parsed.role !== 'student' && parsed.role !== 'mentor') {
        parsed.role = 'student'
      }
      return parsed
    }
  } catch {
    /* ignore malformed storage */
  }
  return { authenticated: false, role: 'student' }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<Persisted>(read)

  const persist = React.useCallback((next: Persisted) => {
    setState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable — session-only is fine */
    }
  }, [])

  const value = React.useMemo<AuthState>(() => {
    const user: User | null = state.authenticated
      ? {
          ...currentUser,
          role: state.role,
          name: state.name || currentUser.name,
          email: state.email || currentUser.email,
        }
      : null

    return {
      user,
      isAuthenticated: state.authenticated,
      role: state.role,
      signIn: (email, role) =>
        persist({
          authenticated: true,
          role: role ?? state.role,
          email: email || currentUser.email,
          name: state.name,
        }),
      signUp: (name, email, role) =>
        persist({ authenticated: true, role, name, email }),
      signOut: () => persist({ authenticated: false, role: 'student' }),
      setRole: (role) => persist({ ...state, role }),
    }
  }, [state, persist])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
