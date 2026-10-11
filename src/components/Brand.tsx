import { PixelMark } from '@/components/PaperBrand'
import { cn } from '@/lib/utils'

/**
 * O(1) mark for the paper pages: the pixel-bitmap ring in black ink with a
 * small bold "O(1)" wordmark. Same props as before so callers don't change.
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
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  }[size]

  const text = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[size]

  return (
    <span className={cn('inline-flex items-center gap-2.5 text-foreground', className)}>
      <PixelMark className={cn('shrink-0', mark)} />
      {showWordmark && (
        <span className={cn('font-bold leading-none tracking-tight text-foreground', text)}>
          O(1)
        </span>
      )}
    </span>
  )
}
