import { useCallback, useRef, useState, type RefObject } from 'react'
import { getLivestreamSocket } from '../../socket'
import { ICE_SERVERS } from '../../signaling'
import type { JoinPeers, SignalPayload } from '../../signaling'
import type { PeerTile } from '../useLivestreamVideo'
import { closeAllPeers, type PeerConn } from '../../webrtc/peerCleanup'

// usePeerMesh – full-mesh peer-connection map for one livestream, no JSX:
// tiles + create/offer/renegotiate + perfect-negotiation-lite signal handling.
// Extracted verbatim from useLivestreamVideo; local tracks read via localRef.
export function usePeerMesh(localRef: RefObject<MediaStream | null>) {
  const [peers, setPeers] = useState<PeerTile[]>([])
  const pcs = useRef(new Map<string, PeerConn>())
  const selfId = useRef('')

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
    [localRef, sendSignal, setPeerStream],
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

  const clearPeers = useCallback(() => {
    closeAllPeers(pcs.current)
    setPeers([])
  }, [])

  const setSelfId = useCallback((id: string) => {
    selfId.current = id
  }, [])

  return {
    pcs,
    selfId,
    peers,
    setPeers,
    addPeer,
    removePeer,
    setPeerStream,
    setPeerMedia,
    sendSignal,
    flushIce,
    createPeer,
    makeOffer,
    renegotiateAll,
    handleSignal,
    clearPeers,
    setSelfId,
  }
}
