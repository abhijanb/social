import { useEffect, useRef } from 'react'

type Args = {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
}

// useInfiniteScroll – observes a sentinel div at the list end and calls
// onLoadMore when it scrolls into view (200px early). Returns the sentinel ref.
// Skips while loading to avoid duplicate fetches; renders nothing when hasMore is false.
export function useInfiniteScroll({ hasMore, isLoading, onLoadMore }: Args) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) onLoadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  return sentinelRef
}
