import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { label: 'Home', href: '#', active: true },
  { label: 'Studio', href: '#studio' },
  { label: 'About', href: '#about' },
  { label: 'Journal', href: '#journal' },
  { label: 'Reach Us', href: '#reach-us' },
]

export function Navbar() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-8 py-6">
      <a
        href="#"
        className="text-3xl tracking-tight text-foreground"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        Velorah<sup className="text-xs">®</sup>
      </a>

      <nav className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            aria-current={link.active ? 'page' : undefined}
            className={`text-sm transition-colors hover:text-foreground ${
              link.active ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <Button
        variant="glass"
        size="none"
        className="rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03]"
      >
        Begin Journey
      </Button>
    </header>
  )
}
