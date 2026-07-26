import { GithubMark, GoogleMark } from '@/components/BrandIcons'
import { Button } from '@/components/ui/button'

export function OAuthButtons({ onProvider }: { onProvider: () => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 bg-secondary/30"
        onClick={onProvider}
      >
        <GoogleMark className="h-[18px] w-[18px]" />
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 bg-secondary/30"
        onClick={onProvider}
      >
        <GithubMark className="h-[18px] w-[18px]" />
        GitHub
      </Button>
    </div>
  )
}
