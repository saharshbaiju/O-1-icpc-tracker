import { cn } from '@/lib/utils'

/**
 * O(1) wordmark. The mark is a violet-cast disc echoing the "O",
 * with the complexity notation set in the display serif.
 */
export function Brand({
  className,
  size = 'md',
  showWordmark = true,
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
}) {
  const mark = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  }[size]

  const text = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size]

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative grid shrink-0 place-items-center rounded-full',
          'bg-[radial-gradient(circle_at_30%_25%,hsl(var(--primary))_0%,hsl(258_90%_42%)_55%,hsl(255_40%_12%)_100%)]',
          'shadow-[0_0_24px_-4px_hsl(var(--primary)/0.7)]',
          mark
        )}
      >
        <span className="absolute inset-[3px] rounded-full border border-white/25" />
      </span>
      {showWordmark && (
        <span
          className={cn('leading-none tracking-tight text-foreground', text)}
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          O<span className="text-primary">(1)</span>
        </span>
      )}
    </span>
  )
}
