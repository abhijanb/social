import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getChatSocket(): Socket {
  if (socket?.connected) return socket
  if (socket) {
    socket.disconnect()
    socket = null
  }
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
  socket = io(`${base}/chat`, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })
  return socket
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
