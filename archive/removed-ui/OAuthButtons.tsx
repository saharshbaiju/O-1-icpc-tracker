import { GithubMark, GoogleMark } from '@/components/BrandIcons'

/* Two pill buttons, outlined, black glyph and label. */
export function OAuthButtons({ onProvider }: { onProvider: () => void }) {
  const cls =
    'inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-xs font-medium text-foreground transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" className={cls} onClick={onProvider}>
        <GoogleMark className="h-4 w-4" />
        Sign in with Google
      </button>
      <button type="button" className={cls} onClick={onProvider}>
        <GithubMark className="h-4 w-4" />
        Sign in with GitHub
      </button>
    </div>
  )
}
