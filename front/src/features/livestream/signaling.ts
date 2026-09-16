import { getLivestreamSocket } from './socket'

export type JoinPeers = { socketId: string; userId: string; username: string; audio: boolean; video: boolean }
export type JoinResult = { ok: true; peers: JoinPeers[] } | { ok: false; error: string }
export type SignalPayload =
  | { from: string; kind: 'offer' | 'answer'; payload: RTCSessionDescriptionInit }
  | { from: string; kind: 'ice'; payload: RTCIceCandidateInit }

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export function waitForConnect(socket: ReturnType<typeof getLivestreamSocket>, ms: number): Promise<void> {
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

export function emitJoin(
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
