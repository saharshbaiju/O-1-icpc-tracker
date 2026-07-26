import { useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
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
import { cn } from '@/lib/utils'

function strengthOf(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning',
  'bg-chart-3',
  'bg-success',
]

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [error, setError] = useState('')

  const strength = strengthOf(password)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter your full name.')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 8)
      return setError('Password must be at least 8 characters.')
    if (!agreed) return setError('Please accept the terms to continue.')

    setError('')
    signUp(name.trim(), email, role)
    navigate('/app')
  }

  function oauth() {
    signUp(name.trim() || 'New Coder', email || 'new@example.com', role)
    navigate('/app')
  }

  return (
    <AuthLayout
      quote="The teams that win regionals are not the ones who solved the most problems. They are the ones who knew which problems to solve."
      attribution="Ishita Rao · Regional coach, mentor on O(1)"
    >
      <div>
        <h1
          className="text-4xl leading-tight tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Start training.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your O(1) account — takes about thirty seconds.
        </p>

        <OAuthButtons onProvider={oauth} />

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            or with email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="ada_l"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
            {password.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        i < strength ? STRENGTH_COLOR[strength] : 'bg-secondary'
                      )}
                    />
                  ))}
                </div>
                <span className="w-16 text-right text-[11px] text-muted-foreground">
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>I am joining as</Label>
            <RolePicker value={role} onChange={setRole} />
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(Boolean(v))}
              className="mt-0.5"
            />
            <span>
              I agree to the{' '}
              <span className="text-foreground underline underline-offset-2">
                terms of service
              </span>{' '}
              and{' '}
              <span className="text-foreground underline underline-offset-2">
                privacy policy
              </span>
              .
            </span>
          </label>

          <Button type="submit" className="h-11 w-full rounded-xl">
            Create account <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {[
            'Free for university teams',
            'Sync Codeforces & more',
            'No credit card needed',
            'Cancel any time',
          ].map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Check className="h-3.5 w-3.5 text-success" /> {p}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
