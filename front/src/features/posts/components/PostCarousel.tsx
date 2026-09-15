import { useRef, useState } from 'react'

type Props = {
  images: string[]
  alt: string
}

// PostCarousel – Instagram-style multi-image viewer: arrows, dots, counter,
// touch swipe. Single image renders without controls. Parent keys by post id
// so index state resets per post (images are immutable after create).
export default function PostCarousel({ images, alt }: Props) {
  const [index, setIndex] = useState(0)
  const touchX = useRef<number | null>(null)
  const count = images.length

  if (count === 0) return null
  const safeIndex = Math.min(index, count - 1)

  const go = (dir: 1 | -1) => setIndex((i) => (Math.min(i, count - 1) + dir + count) % count)

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
      <img
        src={images[safeIndex]}
        alt={`${alt} (${safeIndex + 1}/${count})`}
        loading="lazy"
        className="max-h-96 w-full object-cover"
      />
      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-sm font-bold text-white hover:bg-black/80"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-sm font-bold text-white hover:bg-black/80"
          >
            ›
          </button>
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {safeIndex + 1}/{count}
          </span>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
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
