import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const { signIn, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const err = await signIn(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  // Redirect once the session exists (also skips the form for signed-in visitors).
  if (isAuthenticated) return <Navigate to="/app" replace />

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="font-headline text-4xl sm:text-[2.6rem]">Welcome back!</h1>
        <p className="mt-3 text-xs text-muted-foreground">Your problems, your sheets, your team.</p>

        <form onSubmit={submit} className="mt-8 space-y-3 text-left">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            aria-label="E-mail"
            className="paper-input rounded-full text-xs"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            className="paper-input rounded-full text-xs"
          />

          {error && (
            <p role="alert" className="text-center text-xs text-foreground">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-10 w-full rounded-full bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-[hsl(0_0%_20%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="ml-1 text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
