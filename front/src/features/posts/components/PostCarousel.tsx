import type { PostMediaKind } from '../postsApi'
import { usePostCarousel } from '../hooks/usePostCarousel'
import CarouselArrows from './CarouselArrows'
import CarouselDots from './CarouselDots'

export type CarouselItem = {
  src: string
  kind: PostMediaKind
}

type Props = {
  items: CarouselItem[]
  alt: string
}

// PostCarousel – thin shell: Instagram-style mixed-media viewer.
// Index + swipe + video-pause live in usePostCarousel, controls in parts.
// Renders edge-to-edge inside the card (the card clips corners).
// Parent keys by post id so index state resets per post.
export default function PostCarousel({ items, alt }: Props) {
  const count = items.length
  const { safeIndex, videoRef, go, select, onTouchStart, onTouchEnd } = usePostCarousel(count)

  if (count === 0) return null
  const current = items[safeIndex]

  return (
    <div
      className="relative overflow-hidden border-y border-gray-100 bg-black dark:border-zinc-800"
      onTouchStart={(e) => onTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
    >
      {current.kind === 'VIDEO' ? (
        <video
          key={current.src}
          ref={videoRef}
          src={current.src}
          controls
          preload="metadata"
          playsInline
          className="max-h-[32rem] w-full bg-black object-contain"
        />
      ) : (
        <img
          src={current.src}
          alt={`${alt} (${safeIndex + 1}/${count})`}
          loading="lazy"
          className="max-h-[32rem] w-full bg-black object-cover"
        />
      )}
      {count > 1 && (
        <>
          <CarouselArrows onPrev={() => go(-1)} onNext={() => go(1)} />
          <CarouselDots count={count} active={safeIndex} onSelect={select} />
        </>
      )}
    </div>  
  )
}
