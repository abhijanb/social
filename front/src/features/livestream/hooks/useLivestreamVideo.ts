import { useCallback, useRef, useState } from 'react'
import { disconnectLivestreamSocket, getLivestreamSocket } from '../socket'
import { acquireMedia } from '../media'
import { emitJoin, waitForConnect } from '../signaling'
import type { JoinPeers, SignalPayload } from '../signaling'
import { usePeerMesh } from './webrtc/usePeerMesh'
import { useLocalMedia } from './webrtc/useLocalMedia'

export type PeerTile = {
  socketId: string
  userId: string
  username: string
  stream: MediaStream | null
  audio: boolean
  video: boolean
}

export type JoinMode = 'camera' | 'watch'

// useLivestreamVideo – full-mesh WebRTC session for one livestream.
// Thin orchestrator: peer mesh + local media live in webrtc/ hooks,
// shared cleanup in webrtc/peerCleanup. Return shape unchanged for callers.
export function useLivestreamVideo() {
  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [videoEnded, setVideoEnded] = useState(false)

  // Single local-stream ref shared by the mesh (attaches current tracks to
  // new peers) and the media hook (toggles/acquires tracks).
  const localRef = useRef<MediaStream | null>(null)

  const emitMedia = useCallback((audio: boolean, video: boolean) => {
    getLivestreamSocket().emit('livestream:media-update', { audio, video })
  }, [])

  const mesh = usePeerMesh(localRef)
  const media = useLocalMedia({
    localRef,
    pcs: mesh.pcs,
    emitMedia,
    renegotiateAll: mesh.renegotiateAll,
  })

  const { clearPeers } = mesh
  const { stopLocal } = media
  const { addPeer, createPeer, makeOffer, handleSignal, removePeer, setPeerMedia, setSelfId } = mesh
  const { setLocalStream, setCameraOn, setMicOn, setCameraBlocked } = media

  const leave = useCallback(() => {
    clearPeers()
    stopLocal()
    const socket = getLivestreamSocket()
    socket.off('livestream:peer-joined')
    socket.off('livestream:signal')
    socket.off('livestream:peer-media')
    socket.off('livestream:peer-left')
    socket.off('livestream:ended')
    disconnectLivestreamSocket()
    setJoined(false)
    setJoining(false)
    setVideoEnded(false)
  }, [clearPeers, stopLocal])

  const join = useCallback(
    async (streamId: string, mode: JoinMode) => {
      setJoining(true)
      setJoinError(null)
      setVideoEnded(false)
      try {
        let stream: MediaStream | null = null
        let cam = false
        let mic = false
        let blocked = false
        if (mode === 'camera') {
          const got = await acquireMedia()
          stream = got.stream
          cam = got.cam
          mic = got.mic
          blocked = got.blocked
        }
        localRef.current = stream
        setLocalStream(stream)
        setCameraOn(cam)
        setMicOn(mic)
        setCameraBlocked(blocked)

        const socket = getLivestreamSocket()
        await waitForConnect(socket, 10000)
        setSelfId(socket.id ?? '')

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
          clearPeers()
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
    [
      leave,
      addPeer,
      createPeer,
      makeOffer,
      handleSignal,
      removePeer,
      setPeerMedia,
      clearPeers,
      setSelfId,
      setLocalStream,
      setCameraOn,
      setMicOn,
      setCameraBlocked,
    ],
  )

  return {
    joined,
    joining,
    joinError,
    peers: mesh.peers,
    localStream: media.localStream,
    cameraOn: media.cameraOn,
    micOn: media.micOn,
    cameraBlocked: media.cameraBlocked,
    videoEnded,
    join,
    leave,
    toggleCamera: media.toggleCamera,
    toggleMic: media.toggleMic,
  }
}
