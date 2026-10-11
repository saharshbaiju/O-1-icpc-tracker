import { useEffect, useRef } from 'react'

/**
 * The hero backdrop: a grid of black blocks over light grey, with small
 * "adjacent count" digits on some of the empty cells, minesweeper style.
 * Drawn on a canvas so it stays crisp at any size. The corners where the
 * headline (top-left) and the paragraph (bottom-right) sit are kept clear.
 *
 * Interaction: the cell under the pointer lights up blue, and every so
 * often a cell on the edge of the mass flips, so the field feels alive.
 */
const CELL = 30
const INK = '#171717'
const PAPER = '#e9e9e6'
const DIGIT = '#7a7a76'
const CURSOR = '#1d2a8f'

type Grid = { cols: number; rows: number; cells: Uint8Array; digits: Int8Array }

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function smooth(t: number) {
  return t * t * (3 - 2 * t)
}

function valueNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = smooth(x - x0)
  const fy = smooth(y - y0)
  const a = hash(x0, y0, seed)
  const b = hash(x0 + 1, y0, seed)
  const c = hash(x0, y0 + 1, seed)
  const d = hash(x0 + 1, y0 + 1, seed)
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy
}

function buildGrid(cols: number, rows: number, seed: number): Grid {
  const cells = new Uint8Array(cols * rows)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const u = x / cols
      const v = y / rows
      const n =
        valueNoise(x / 6, y / 6, seed) * 0.45 +
        valueNoise(x / 2.5, y / 2.5, seed + 7) * 0.3 +
        hash(x, y, seed + 13) * 0.25
      // Keep the top-left (headline) and bottom-right (copy) corners clear,
      // and pull the mass into a band running from the lower-left up to the right.
      // Portrait screens have no side room, so the clear zones become full-width bands.
      const portrait = cols < rows
      const clearTL = portrait
        ? Math.max(0, 1 - v / 0.42)
        : Math.max(0, 1 - Math.hypot(u / 0.5, v / 0.6))
      const clearBR = portrait
        ? Math.max(0, 1 - (1 - v) / 0.34)
        : Math.max(0, 1 - Math.hypot((1 - u) / 0.42, (1 - v) / 0.42))
      const band = 1 - Math.abs(v - (0.68 - 0.3 * u)) / 0.3
      const bias = band * 0.32 - clearTL * 1.4 - clearBR * 1.2
      const lone = hash(x, y, seed + 21) < 0.012 && clearTL < 0.1 && clearBR < 0.1
      cells[y * cols + x] = n + bias > 0.56 || lone ? 1 : 0
    }
  }
  const digits = new Int8Array(cols * rows).fill(-1)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (cells[y * cols + x]) continue
      let count = 0
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
          count += cells[ny * cols + nx]
        }
      if (count > 0 && hash(x, y, seed + 99) < 0.42) digits[y * cols + x] = count
    }
  }
  return { cols, rows, cells, digits }
}

export function PixelField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let grid: Grid | null = null
    let hover = -1
    let raf = 0
    let seed = 3

    function draw() {
      if (!grid) return
      const dpr = window.devicePixelRatio || 1
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.fillStyle = PAPER
      ctx!.fillRect(0, 0, canvas!.clientWidth, canvas!.clientHeight)
      ctx!.fillStyle = INK
      for (let y = 0; y < grid.rows; y++)
        for (let x = 0; x < grid.cols; x++)
          if (grid.cells[y * grid.cols + x]) ctx!.fillRect(x * CELL, y * CELL, CELL, CELL)

      ctx!.fillStyle = DIGIT
      ctx!.font = '9px ui-monospace, monospace'
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      for (let y = 0; y < grid.rows; y++)
        for (let x = 0; x < grid.cols; x++) {
          const d = grid.digits[y * grid.cols + x]
          if (d > 0) ctx!.fillText(String(d), x * CELL + CELL / 2, y * CELL + CELL / 2 + 1)
        }

      if (hover >= 0) {
        const hx = hover % grid.cols
        const hy = Math.floor(hover / grid.cols)
        ctx!.save()
        ctx!.shadowColor = CURSOR
        ctx!.shadowBlur = 18
        ctx!.fillStyle = CURSOR
        ctx!.fillRect(hx * CELL, hy * CELL, CELL, CELL)
        ctx!.restore()
      }
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const w = canvas!.clientWidth
      const h = canvas!.clientHeight
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      grid = buildGrid(Math.ceil(w / CELL), Math.ceil(h / CELL), seed)
      draw()
    }

    function onMove(e: PointerEvent) {
      if (!grid) return
      const rect = canvas!.getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / CELL)
      const y = Math.floor((e.clientY - rect.top) / CELL)
      const next = x >= 0 && y >= 0 && x < grid.cols && y < grid.rows ? y * grid.cols + x : -1
      if (next !== hover) {
        hover = next
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(draw)
      }
    }
    function onLeave() {
      hover = -1
      raf = requestAnimationFrame(draw)
    }

    // Flip one cell on the border of the mass every so often
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tick = reduce
      ? 0
      : window.setInterval(() => {
          if (!grid) return
          for (let tries = 0; tries < 40; tries++) {
            const i = Math.floor(Math.random() * grid.cells.length)
            const x = i % grid.cols
            const y = Math.floor(i / grid.cols)
            if (x === 0 || y === 0 || x === grid.cols - 1 || y === grid.rows - 1) continue
            const self = grid.cells[i]
            const n =
              grid.cells[i - 1] + grid.cells[i + 1] + grid.cells[i - grid.cols] + grid.cells[i + grid.cols]
            if ((self && n < 4) || (!self && n > 0 && n < 4 && grid.digits[i] < 0)) {
              grid.cells[i] = self ? 0 : 1
              break
            }
          }
          raf = requestAnimationFrame(draw)
        }, 900)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    const parent = canvas.parentElement ?? canvas
    parent.addEventListener('pointermove', onMove)
    parent.addEventListener('pointerleave', onLeave)
    return () => {
      ro.disconnect()
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
      if (tick) clearInterval(tick)
      seed++
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={className} />
}
