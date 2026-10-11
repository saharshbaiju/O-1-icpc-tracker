import { cn } from '@/lib/utils'

/**
 * Pixel-cut O(1) mark for the paper pages: a 7x7 bitmap ring with a centre
 * dot, drawn as SVG rects so it stays hard-edged at any size. Optional
 * two-line wordmark beside it.
 */
const BITMAP = [
  '.XXXXX.',
  'XX...XX',
  'X.....X',
  'X..X..X',
  'X.....X',
  'XX...XX',
  '.XXXXX.',
]

export function PixelMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      className={cn('h-7 w-7 fill-current', className)}
      aria-hidden
    >
      {BITMAP.flatMap((row, y) =>
        [...row].map((c, x) =>
          c === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null
        )
      )}
    </svg>
  )
}

export function PaperBrand({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-foreground', className)}>
      <PixelMark />
      {showWordmark && (
        <span className="text-[11px] font-bold leading-[1.15] tracking-tight">
          O(1)
          <br />
          ICPC Training
        </span>
      )}
    </span>
  )
}
