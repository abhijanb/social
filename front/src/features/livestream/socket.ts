import { io, type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '../../app/config'

let socket: Socket | null = null

// Singleton for the /livestream namespace (WebRTC signaling). Created on
// demand when joining video and torn down on leave (unlike the long-lived
// chat/presence sockets, video is per-room).
export function getLivestreamSocket(): Socket {
  if (socket?.connected) return socket
  if (socket) {
    socket.disconnect()
    socket = null
  }
  const base = getApiBaseUrl()
  socket = io(`${base}/livestream`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })
  return socket
}

export function disconnectLivestreamSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
