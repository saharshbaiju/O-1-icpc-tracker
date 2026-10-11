import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { DitherImage } from '@/components/DitherImage'
import { PixelMark } from '@/components/PaperBrand'

/* Scenery that rotates on the right-hand panel. Any CORS-enabled image works. */
const SCENES = [
  'https://picsum.photos/id/1015/1200/1600', // river gorge
  'https://picsum.photos/id/1036/1200/1600', // snow lake
  'https://picsum.photos/id/1043/1200/1600', // forest hills
  'https://picsum.photos/id/1018/1200/1600', // mountain ridge
  'https://picsum.photos/id/1039/1200/1600', // waterfall
]

/**
 * Paper auth shell: a white sheet on a grey ground, form on the left, a
 * dithered black-and-white photograph on the right. On small screens the
 * image drops away and the sheet fills the page.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-paper min-h-screen p-4 sm:p-8 lg:p-12">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1400px] bg-card sm:min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-6rem)] lg:grid-cols-2">
        {/* Form side */}
        <div className="relative flex flex-col px-6 py-8 sm:px-12">
          <Link to="/" className="mx-auto inline-flex text-foreground" aria-label="O(1) home">
            <PixelMark className="h-6 w-6" />
          </Link>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-sm">{children}</div>
          </div>

          <nav className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
            <a href="#" className="hover:text-foreground">Help</a>
            <span aria-hidden>/</span>
            <a href="#" className="hover:text-foreground">Terms</a>
            <span aria-hidden>/</span>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </nav>
        </div>

        {/* Image side */}
        <div className="relative hidden overflow-hidden lg:block">
          <DitherImage sources={SCENES} interval={9000} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
    </div>
  )
}
