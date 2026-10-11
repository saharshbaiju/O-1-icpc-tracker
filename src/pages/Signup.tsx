import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuth } from '@/lib/auth'
import { CollegeInput } from '@/components/CollegeInput'
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

export default function Signup() {
  const { signUp, isAuthenticated } = useAuth()
  const [created, setCreated] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [university, setUniversity] = useState('')
  const [city, setCity] = useState('')
  const [isNewUniversity, setIsNewUniversity] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const strength = strengthOf(password)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter your full name.')
    if (!email.includes('@')) return setError('Enter a valid e-mail address.')
    if (!university.trim()) return setError('Enter your college.')
    if (isNewUniversity && !city.trim()) return setError('Enter the city of your new college.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    setError('')
    setCreated(true) // also disables the button, so the form cannot be sent twice
    const err = await signUp({ name, email, password, university, city, cf_handle: handle })
    if (err) {
      setCreated(false)
      setError(err)
      if (err.includes('city')) setIsNewUniversity(true) // a college we have not seen before
    }
  }

  // New accounts land on the team page; anyone else already signed in goes to the dashboard.
  if (isAuthenticated) return <Navigate to={created ? '/app/team' : '/app'} replace />

  return (
    <AuthLayout>
      <div>
        <h1 className="font-headline text-center text-4xl">Start training.</h1>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Create your account, then join or create a team.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3 text-left">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            aria-label="Full name"
            autoComplete="name"
            className="paper-input rounded-full text-xs"
          />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            aria-label="E-mail"
            className="paper-input rounded-full text-xs"
          />

          <CollegeInput value={university} onChange={setUniversity} onIsNewChange={setIsNewUniversity} />
          {isNewUniversity && (
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City of the new college"
              aria-label="City of the university"
              className="paper-input rounded-full text-xs"
            />
          )}

          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Codeforces handle (optional)"
            aria-label="Codeforces handle"
            className="paper-input rounded-full text-xs"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (at least 8 characters)"
              aria-label="Password"
              className="paper-input rounded-full pr-11 text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn('h-px flex-1', i < strength ? 'bg-foreground' : 'bg-border')} />
                ))}
              </div>
              <span className="w-16 text-right text-[11px] text-muted-foreground">{STRENGTH_LABEL[strength]}</span>
            </div>
          )}

          {error && (
            <p role="alert" className="text-center text-xs text-foreground">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={created}
            className="h-10 w-full rounded-full bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-[hsl(0_0%_20%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {created ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="ml-1 text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
