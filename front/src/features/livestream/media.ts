// Shared camera/mic acquisition for livestreams – extracted from useLivestreamVideo.
// Fallback chain: full media → audio-only → receive-only. Denied/absent
// camera still joins (video off), never blocks entry.
export async function acquireMedia(): Promise<{
  stream: MediaStream | null
  cam: boolean
  mic: boolean
  blocked: boolean
}> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { stream: null, cam: false, mic: false, blocked: true }
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { echoCancellation: true },
    })
    return { stream, cam: true, mic: stream.getAudioTracks().length > 0, blocked: false }
  } catch {
    // Camera denied or missing — fall back to mic-only.
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return { stream, cam: false, mic: true, blocked: true }
  } catch {
    return { stream: null, cam: false, mic: false, blocked: true }
  }
}
