import { useEffect, useRef } from 'react'

// LivestreamVideoTile – binds a MediaStream to a <video> element (external DOM sync). No other logic.
export default function LivestreamVideoTile({
  stream,
  muted,
  label,
}: {
  stream: MediaStream
  muted: boolean
  label: string
}) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (el && el.srcObject !== stream) el.srcObject = stream
  }, [stream])

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      aria-label={label}
      className="h-full w-full object-cover"
    />
  )
}
