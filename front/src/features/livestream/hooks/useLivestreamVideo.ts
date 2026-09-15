import { useCallback, useRef, useState } from 'react'
import { disconnectLivestreamSocket, getLivestreamSocket } from '../socket'

export type PeerTile = {
  socketId: string
  userId: string
  username: string
  stream: MediaStream | null
  audio: boolean
  video: boolean
}

export type JoinMode = 'camera' | 'watch'

type JoinPeers = { socketId: string; userId: string; username: string; audio: boolean; video: boolean }
type JoinResult = { ok: true; peers: JoinPeers[] } | { ok: false; error: string }
type SignalPayload =
  | { from: string; kind: 'offer' | 'answer'; payload: RTCSessionDescriptionInit }
  | { from: string; kind: 'ice'; payload: RTCIceCandidateInit }

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

type PeerConn = {
  pc: RTCPeerConnection
  makingOffer: boolean
  pendingIce: RTCIceCandidateInit[]
}

// Camera fallback chain: full media → audio-only → receive-only.
// Denied/absent camera still joins (video off), never blocks entry.
async function acquireMedia(): Promise<{ stream: MediaStream | null; cam: boolean; mic: boolean; blocked: boolean }> {
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

function waitForConnect(socket: ReturnType<typeof getLivestreamSocket>, ms: number): Promise<void> {
  if (socket.connected) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('connect', onConnect)
      reject(new Error('Could not reach the live server'))
    }, ms)
    const onConnect = () => {
      clearTimeout(timer)
      resolve()
    }
    socket.once('connect', onConnect)
  })
}

function emitJoin(
  socket: ReturnType<typeof getLivestreamSocket>,
  streamId: string,
  audio: boolean,
  video: boolean,
): Promise<JoinResult> {
  return new Promise((resolve) => {
    let done = false
    const timer = setTimeout(() => {
      if (!done) {
        done = true
        resolve({ ok: false, error: 'Join timed out' })
      }
    }, 10000)
    socket.emit('livestream:join', { streamId, audio, video }, (res: JoinResult) => {
      if (!done) {
        done = true
        clearTimeout(timer)
        resolve(res)
      }
    })
  })
}

// useLivestreamVideo – full-mesh WebRTC video for one livestream.
// Every peer connects to every other peer (fine for friend-size rooms).
// Camera/mic are optional: denial falls back to audio-only or watch-only,
// and tracks toggle via .enabled (no renegotiation) except when a brand
// new track is acquired mid-call (retryCamera/unmute), which re-offers.
export function useLivestreamVideo() {
  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [peers, setPeers] = useState<PeerTile[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  const pcs = useRef(new Map<string, PeerConn>())
  const localRef = useRef<MediaStream | null>(null)
  const selfId = useRef('')
  const streamIdRef = useRef('')

  const emitMedia = useCallback((audio: boolean, video: boolean) => {
    getLivestreamSocket().emit('livestream:media-update', { audio, video })
  }, [])

  const addPeer = useCallback((peer: JoinPeers) => {
    setPeers((prev) => {
      if (prev.some((p) => p.socketId === peer.socketId)) return prev
      return [...prev, { ...peer, stream: null }]
    })
  }, [])

  const removePeer = useCallback((socketId: string) => {
    const entry = pcs.current.get(socketId)
    entry?.pc.close()
    pcs.current.delete(socketId)
    setPeers((prev) => prev.filter((p) => p.socketId !== socketId))
  }, [])

  const setPeerStream = useCallback((socketId: string, stream: MediaStream) => {
    setPeers((prev) => prev.map((p) => (p.socketId === socketId ? { ...p, stream } : p)))
  }, [])

  const setPeerMedia = useCallback((socketId: string, audio: boolean, video: boolean) => {
    setPeers((prev) => prev.map((p) => (p.socketId === socketId ? { ...p, audio, video } : p)))
  }, [])

  const sendSignal = useCallback((to: string, kind: 'offer' | 'answer' | 'ice', payload: unknown) => {
    getLivestreamSocket().emit('livestream:signal', { to, kind, payload })
  }, [])

  const flushIce = useCallback(async (socketId: string) => {
    const entry = pcs.current.get(socketId)
    if (!entry) return
    const queued = entry.pendingIce.splice(0)
    for (const candidate of queued) {
      try {
        await entry.pc.addIceCandidate(candidate)
      } catch {
        // stale candidate — safe to drop
      }
    }
  }, [])

  const createPeer = useCallback(
    (socketId: string) => {
      const existing = pcs.current.get(socketId)
      if (existing) return existing
      const pc = new RTCPeerConnection(ICE_SERVERS)
      const entry: PeerConn = { pc, makingOffer: false, pendingIce: [] }
      pcs.current.set(socketId, entry)
      const local = localRef.current
      if (local) {
        for (const track of local.getTracks()) pc.addTrack(track, local)
      }
      pc.onicecandidate = (e) => {
        if (e.candidate) sendSignal(socketId, 'ice', e.candidate.toJSON())
      }
      pc.ontrack = (e) => {
        const remote = e.streams[0] ?? new MediaStream([e.track])
        setPeerStream(socketId, remote)
      }
      return entry
    },
    [sendSignal, setPeerStream],
  )

  const makeOffer = useCallback(
    async (socketId: string) => {
      const entry = pcs.current.get(socketId)
      if (!entry) return
      entry.makingOffer = true
      try {
        const offer = await entry.pc.createOffer()
        await entry.pc.setLocalDescription(offer)
        sendSignal(socketId, 'offer', offer)
      } finally {
        entry.makingOffer = false
      }
    },
    [sendSignal],
  )

  const renegotiateAll = useCallback(async () => {
    for (const socketId of pcs.current.keys()) {
      try {
        await makeOffer(socketId)
      } catch {
        // one failed renegotiation must not break the others
      }
    }
  }, [makeOffer])

  const handleSignal = useCallback(
    async (msg: SignalPayload) => {
      const { from, kind, payload } = msg
      if (kind === 'ice') {
        const entry = pcs.current.get(from)
        if (!entry) return
        if (entry.pc.remoteDescription) {
          try {
            await entry.pc.addIceCandidate(payload)
          } catch {
            // stale candidate — safe to drop
          }
        } else {
          entry.pendingIce.push(payload)
        }
        return
      }
      const entry = createPeer(from)
      const pc = entry.pc
      if (kind === 'offer') {
        // Perfect-negotiation-lite: the lexicographically greater socket id
        // is polite (rolls back and answers); the other side's offer wins.
        const polite = selfId.current > from
        if (pc.signalingState !== 'stable') {
          if (!polite) return
          await pc.setLocalDescription({ type: 'rollback' })
        }
        await pc.setRemoteDescription(payload)
        await flushIce(from)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal(from, 'answer', answer)
        return
      }
      await pc.setRemoteDescription(payload)
      await flushIce(from)
    },
    [createPeer, flushIce, sendSignal],
  )

  const leave = useCallback(() => {
    for (const [, entry] of pcs.current) {
      try {
        entry.pc.close()
      } catch {
        // already closed
      }
    }
    pcs.current.clear()
    const local = localRef.current
    localRef.current = null
    if (local) {
      for (const track of local.getTracks()) track.stop()
    }
    const socket = getLivestreamSocket()
    socket.off('livestream:peer-joined')
    socket.off('livestream:signal')
    socket.off('livestream:peer-media')
    socket.off('livestream:peer-left')
    socket.off('livestream:ended')
    disconnectLivestreamSocket()
    setPeers([])
    setLocalStream(null)
    setCameraOn(false)
    setMicOn(false)
    setJoined(false)
    setJoining(false)
    setVideoEnded(false)
  }, [])

  const join = useCallback(
    async (streamId: string, mode: JoinMode) => {
      setJoining(true)
      setJoinError(null)
      setVideoEnded(false)
      try {
        let media: MediaStream | null = null
        let cam = false
        let mic = false
        let blocked = false
        if (mode === 'camera') {
          const got = await acquireMedia()
          media = got.stream
          cam = got.cam
          mic = got.mic
          blocked = got.blocked
        }
        localRef.current = media
        streamIdRef.current = streamId
        setLocalStream(media)
        setCameraOn(cam)
        setMicOn(mic)
        setCameraBlocked(blocked)

        const socket = getLivestreamSocket()
        await waitForConnect(socket, 10000)
        selfId.current = socket.id ?? ''

        socket.on('livestream:peer-joined', (peer: JoinPeers) => {
          addPeer(peer)
          void makeOffer(peer.socketId).catch(() => {
            // offer failure surfaces as a missing tile, not a crash
          })
        })
        socket.on('livestream:signal', (msg: SignalPayload) => {
          void handleSignal(msg).catch(() => {
            // malformed signal — ignore
          })
        })
        socket.on('livestream:peer-media', (msg: { socketId: string; audio: boolean; video: boolean }) => {
          setPeerMedia(msg.socketId, msg.audio === true, msg.video === true)
        })
        socket.on('livestream:peer-left', (msg: { socketId: string }) => {
          removePeer(msg.socketId)
        })
        socket.on('livestream:ended', () => {
          for (const [, entry] of pcs.current) {
            try {
              entry.pc.close()
            } catch {
              // already closed
            }
          }
          pcs.current.clear()
          setPeers([])
          setVideoEnded(true)
        })

        const res = await emitJoin(socket, streamId, mic, cam)
        if (!res.ok) throw new Error(res.error)
        for (const peer of res.peers) {
          addPeer(peer)
          createPeer(peer.socketId)
          await makeOffer(peer.socketId)
        }
        setJoined(true)
      } catch (e: unknown) {
        setJoinError(e instanceof Error ? e.message : 'Failed to join video')
        leave()
      } finally {
        setJoining(false)
      }
    },
    [addPeer, createPeer, handleSignal, leave, makeOffer, removePeer, setPeerMedia],
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
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true })
      const [videoTrack] = s.getVideoTracks()
      if (!videoTrack) return
      let local = localRef.current
      if (!local) {
        local = new MediaStream()
        localRef.current = local
      }
      local.addTrack(videoTrack)
      setLocalStream(new MediaStream(local.getTracks()))
      setCameraOn(true)
      setCameraBlocked(false)
      for (const [, entry] of pcs.current) {
        try {
          entry.pc.addTrack(videoTrack, local)
        } catch {
          // track already added
        }
      }
      const mic = local.getAudioTracks()[0]
      emitMedia(mic ? mic.enabled : false, true)
      await renegotiateAll()
    } catch {
      setCameraBlocked(true)
    }
  }, [emitMedia, renegotiateAll])

  const toggleMic = useCallback(async () => {
    const track = localRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setMicOn(track.enabled)
      const cam = localRef.current?.getVideoTracks()[0]
      emitMedia(track.enabled, cam ? cam.enabled : false)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      const [audioTrack] = s.getAudioTracks()
      if (!audioTrack) return
      let local = localRef.current
      if (!local) {
        local = new MediaStream()
        localRef.current = local
      }
      local.addTrack(audioTrack)
      setLocalStream(new MediaStream(local.getTracks()))
      setMicOn(true)
      for (const [, entry] of pcs.current) {
        try {
          entry.pc.addTrack(audioTrack, local)
        } catch {
          // track already added
        }
      }
      const cam = local.getVideoTracks()[0]
      emitMedia(true, cam ? cam.enabled : false)
      await renegotiateAll()
    } catch {
      // mic denied — stay muted
    }
  }, [emitMedia, renegotiateAll])

  return {
    joined,
    joining,
    joinError,
    peers,
    localStream,
    cameraOn,
    micOn,
    cameraBlocked,
    videoEnded,
    join,
    leave,
    toggleCamera,
    toggleMic,
  }
}
