import { useRef, useState } from 'react'

// usePostCarousel – index + swipe + video-pause logic for PostCarousel, no JSX.
// Handlers take raw clientX numbers so the hook stays DOM-free.
// Parent keys by post id so index state resets per post.
export function usePostCarousel(count: number) {
  const [index, setIndex] = useState(0)
  const touchX = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const safeIndex = Math.min(index, Math.max(count - 1, 0))

  const go = (dir: 1 | -1) => {
    videoRef.current?.pause()
    setIndex((i) => (Math.min(i, count - 1) + dir + count) % count)
  }

  const select = (i: number) => {
    videoRef.current?.pause()
    setIndex(i)
  }

  const onTouchStart = (x: number) => {
    touchX.current = x
  }

  const onTouchEnd = (x: number) => {
    if (touchX.current == null) return
    const dx = x - touchX.current
    touchX.current = null
    if (Math.abs(dx) < 30) return
    go(dx < 0 ? 1 : -1)
  }

  return { safeIndex, videoRef, go, select, onTouchStart, onTouchEnd }
}
