import { useRef, useState } from 'react'
import type { PostMediaKind } from '../postsApi'

export type CarouselItem = {
  src: string
  kind: PostMediaKind
}

type Props = {
  items: CarouselItem[]
  alt: string
}

// PostCarousel – Instagram-style mixed-media viewer: arrows, dots, counter,
// touch swipe. Videos render with controls and pause when navigating away.
// Single attachment renders without controls. Parent keys by post id
// so index state resets per post (media is immutable after create).
export default function PostCarousel({ items, alt }: Props) {
  const [index, setIndex] = useState(0)
  const touchX = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const count = items.length

  if (count === 0) return null
  const safeIndex = Math.min(index, count - 1)
  const current = items[safeIndex]

  const go = (dir: 1 | -1) => {
    videoRef.current?.pause()
    setIndex((i) => (Math.min(i, count - 1) + dir + count) % count)
  }

  const select = (i: number) => {
    videoRef.current?.pause()
    setIndex(i)
  }

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-lg"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) < 30) return
        go(dx < 0 ? 1 : -1)
      }}
    >
      {current.kind === 'VIDEO' ? (
        <video
          key={current.src}
          ref={videoRef}
          src={current.src}
          controls
          preload="metadata"
          playsInline
          className="max-h-96 w-full bg-black object-contain"
        />
      ) : (
        <img
          src={current.src}
          alt={`${alt} (${safeIndex + 1}/${count})`}
          loading="lazy"
          className="max-h-96 w-full object-cover"
        />
      )}
      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous attachment"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-sm font-bold text-white hover:bg-black/80"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next attachment"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-sm font-bold text-white hover:bg-black/80"
          >
            ›
          </button>
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {safeIndex + 1}/{count}
          </span>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => select(i)}
                aria-label={`Go to attachment ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
