import { useCallback, useState, type RefObject } from 'react'
import type { PeerConn } from './peerCleanup'

// useLocalMedia – local camera/mic tracks for one livestream, no JSX.
// Merges the near-identical toggleCamera/toggleMic acquire paths into one
// ensureTrack(kind); plain .enabled flips need no renegotiation.
// localRef is owned by the parent session hook and shared with usePeerMesh
// (createPeer attaches current tracks), so both see the same stream.
export function useLocalMedia({
  localRef,
  pcs,
  emitMedia,
  renegotiateAll,
}: {
  localRef: RefObject<MediaStream | null>
  pcs: RefObject<Map<string, PeerConn>>
  emitMedia: (audio: boolean, video: boolean) => void
  renegotiateAll: () => Promise<void>
}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)

  const ensureTrack = useCallback(
    async (kind: 'video' | 'audio') => {
      if (!navigator.mediaDevices?.getUserMedia) return
      try {
        const s = await navigator.mediaDevices.getUserMedia(
          kind === 'video' ? { video: true } : { audio: true },
        )
        const [track] = kind === 'video' ? s.getVideoTracks() : s.getAudioTracks()
        if (!track) return
        let local = localRef.current
        if (!local) {
          local = new MediaStream()
          localRef.current = local
        }
        local.addTrack(track)
        setLocalStream(new MediaStream(local.getTracks()))
        for (const [, entry] of pcs.current?.entries() ?? []) {
          try {
            entry.pc.addTrack(track, local)
          } catch {
            // track already added
          }
        }
        const mic = local.getAudioTracks()[0]
        const cam = local.getVideoTracks()[0]
        if (kind === 'video') {
          setCameraOn(true)
          setCameraBlocked(false)
          emitMedia(mic ? mic.enabled : false, true)
        } else {
          setMicOn(true)
          emitMedia(true, cam ? cam.enabled : false)
        }
        await renegotiateAll()
      } catch {
        if (kind === 'video') setCameraBlocked(true)
        // mic denied — stay muted
      }
    },
    [emitMedia, localRef, pcs, renegotiateAll],
  )

  const toggleCamera = useCallback(async () => {
    const track = localRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setCameraOn(track.enabled)
      const mic = localRef.current?.getAudioTracks()[0]
      emitMedia(mic ? mic.enabled : false, track.enabled)
      return
    }
    // No camera track yet (joined without one) — try acquiring now.
    await ensureTrack('video')
  }, [emitMedia, ensureTrack, localRef])

  const toggleMic = useCallback(async () => {
    const track = localRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setMicOn(track.enabled)
      const cam = localRef.current?.getVideoTracks()[0]
      emitMedia(track.enabled, cam ? cam.enabled : false)
      return
    }
    await ensureTrack('audio')
  }, [emitMedia, ensureTrack, localRef])

  const stopLocal = useCallback(() => {
    const local = localRef.current
    localRef.current = null
    if (local) {
      for (const track of local.getTracks()) track.stop()
    }
    setLocalStream(null)
    setCameraOn(false)
    setMicOn(false)
  }, [localRef])

  return {
    localRef,
    localStream,
    setLocalStream,
    cameraOn,
    setCameraOn,
    micOn,
    setMicOn,
    cameraBlocked,
    setCameraBlocked,
    toggleCamera,
    toggleMic,
    stopLocal,
  }
}
