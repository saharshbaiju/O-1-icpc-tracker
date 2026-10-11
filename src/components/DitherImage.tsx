import { useEffect, useRef } from 'react'

/**
 * A rotating set of scenery photos reduced to pure black and white with
 * ordered (Bayer) dithering, the way the login mock renders its garden.
 *
 * The panel never shows a scene plainly: it starts as random dots that
 * slide and flicker into place, and every `interval` ms the dots scramble
 * again and settle into the next scene. Images load with CORS so the
 * canvas can read their pixels; a scene that fails to load is skipped, and
 * if none load a procedural gradient stands in.
 */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

const DOT = 3 // size of one dither dot in CSS pixels
const INK = 20
const PAPER = 235
const TRANSITION_MS = 2200
const DRIFT = 10 // how far (in dots) a settling dot slides in from

export function DitherImage({
  sources,
  interval = 9000,
  className,
}: {
  sources: string[]
  interval?: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let w = 1
    let h = 1
    let images: HTMLImageElement[] = []
    let index = -1
    let current: Uint8Array | null = null // bitmap on screen when a transition began
    let target: Uint8Array | null = null // bitmap we are settling into
    let seeds: Float32Array | null = null // per-dot random order + drift direction
    let transitionStart = 0
    let raf = 0
    let timer = 0
    let disposed = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function noise(): Uint8Array {
      const b = new Uint8Array(w * h)
      for (let i = 0; i < b.length; i++) b[i] = Math.random() < 0.5 ? 1 : 0
      return b
    }

    function ditherOf(img: HTMLImageElement | null): Uint8Array {
      let data: Uint8ClampedArray
      if (img) {
        const scale = Math.max(w / img.width, h / img.height)
        const dw = img.width * scale
        const dh = img.height * scale
        ctx!.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
        data = ctx!.getImageData(0, 0, w, h).data
      } else {
        data = new Uint8ClampedArray(w * h * 4)
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4
            const v =
              40 + 170 * (0.55 * (1 - y / h) + 0.45 * Math.abs(Math.sin(x / 23) * Math.cos(y / 31)))
            data[i] = data[i + 1] = data[i + 2] = v
            data[i + 3] = 255
          }
      }
      const b = new Uint8Array(w * h)
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          const l = Math.min(255, Math.max(0, (lum - 128) * 1.9 + 128))
          const t = ((BAYER[y & 3][x & 3] + 0.5) / 16) * 255
          b[y * w + x] = l > t ? 1 : 0
        }
      return b
    }

    function paint(bitmap: Uint8Array) {
      const out = ctx!.createImageData(w, h)
      for (let i = 0; i < bitmap.length; i++) {
        const v = bitmap[i] ? PAPER : INK
        const o = i * 4
        out.data[o] = out.data[o + 1] = out.data[o + 2] = v
        out.data[o + 3] = 255
      }
      ctx!.putImageData(out, 0, 0)
    }

    function reseed() {
      seeds = new Float32Array(w * h * 2)
      for (let i = 0; i < w * h; i++) {
        seeds[i * 2] = Math.random() // when this dot starts settling
        seeds[i * 2 + 1] = Math.random() < 0.5 ? -1 : 1 // which way it slides in from
      }
    }

    /* One animation frame: each dot is either still the old scene, in flux
       (sliding in from an offset and flickering), or settled on the new scene. */
    function frame(now: number) {
      if (disposed || !current || !target || !seeds) return
      const p = Math.min(1, (now - transitionStart) / TRANSITION_MS)
      const out = new Uint8Array(w * h)
      const window_ = 0.35 // fraction of the timeline a single dot spends in flux
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x
          const start = seeds[i * 2] * (1 - window_)
          if (p < start) {
            out[i] = current[i]
          } else if (p >= start + window_) {
            out[i] = target[i]
          } else {
            const local = (p - start) / window_ // 0 → 1 within this dot's flux
            const ease = 1 - (1 - local) * (1 - local)
            const dx = Math.round((1 - ease) * DRIFT * seeds[i * 2 + 1])
            const sx = Math.min(w - 1, Math.max(0, x + dx))
            // Mostly the target sampled from a sliding offset; some noise while far from home.
            out[i] = Math.random() < (1 - ease) * 0.35 ? (Math.random() < 0.5 ? 1 : 0) : target[y * w + sx]
          }
        }
      paint(out)
      if (p < 1) raf = requestAnimationFrame(frame)
      else current = target
    }

    function transitionTo(next: Uint8Array) {
      cancelAnimationFrame(raf)
      if (!current) current = noise()
      target = next
      if (reduce) {
        current = target
        paint(target)
        return
      }
      reseed()
      transitionStart = performance.now()
      raf = requestAnimationFrame(frame)
    }

    function showIndex(i: number) {
      index = i
      transitionTo(ditherOf(images[i] ?? null))
    }

    function advance() {
      if (!images.length) return
      showIndex((index + 1) % images.length)
    }

    function resize() {
      w = Math.max(1, Math.floor(canvas!.clientWidth / DOT))
      h = Math.max(1, Math.floor(canvas!.clientHeight / DOT))
      canvas!.width = w
      canvas!.height = h
      current = noise()
      paint(current)
      if (index >= 0) showIndex(index)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    // Load every scene; the first one to arrive starts the show.
    let loaded = 0
    let failed = 0
    const pending: HTMLImageElement[] = sources.map((src) => {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      el.onload = () => {
        if (disposed) return
        loaded++
        images = pending.filter((im) => im.complete && im.naturalWidth > 0)
        if (index < 0) {
          showIndex(0)
          if (!reduce) timer = window.setInterval(advance, interval)
        }
      }
      el.onerror = () => {
        failed++
        if (!disposed && index < 0 && loaded === 0 && failed === sources.length) {
          transitionTo(ditherOf(null))
        }
      }
      el.src = src
      return el
    })
    if (!sources.length) transitionTo(ditherOf(null))

    return () => {
      disposed = true
      ro.disconnect()
      cancelAnimationFrame(raf)
      if (timer) clearInterval(timer)
    }
  }, [sources, interval])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
