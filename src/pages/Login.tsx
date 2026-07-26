import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { OAuthButtons } from '@/components/OAuthButtons'
import { RolePicker } from '@/components/RolePicker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/lib/auth'
import type { Role } from '@/lib/data'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('iqbal1729@gmail.com')
  const [password, setPassword] = useState('icpc2026')
  const [role, setRole] = useState<Role>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.')
      return
    }
    setError('')
    signIn(email, role)
    navigate('/app')
  }

  function oauth() {
    signIn(email, role)
    navigate('/app')
  }

  return (
    <AuthLayout
      quote="Rating is a lagging indicator. The work you do tonight shows up three contests from now."
      attribution="Aarav Mehta · ICPC World Finalist, mentor on O(1)"
    >
      <div>
        <h1
          className="text-4xl leading-tight tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Welcome back.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to pick up your streak, sheets, and upcoming contests.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/login"
                className="text-xs text-primary transition-colors hover:text-primary/80"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sign in as</Label>
            <RolePicker value={role} onChange={setRole} />
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
            <Checkbox defaultChecked />
            Keep me signed in on this device
          </label>

          <Button type="submit" className="h-11 w-full rounded-xl">
            Sign in <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            or continue with
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <OAuthButtons onProvider={oauth} />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to O(1)?{' '}
          <Link
            to="/signup"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
