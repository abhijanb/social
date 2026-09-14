import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getPresenceSocket(): Socket {
  if (socket?.connected) return socket
  if (socket) {
    socket.disconnect()
    socket = null
  }
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
  socket = io(`${base}/presence`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })
  return socket
}

export function disconnectPresenceSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
