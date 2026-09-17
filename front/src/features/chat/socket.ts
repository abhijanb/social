import { io, type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '../../app/config'

let socket: Socket | null = null

export function getChatSocket(): Socket {
  if (socket?.connected) return socket
  if (socket) {
    socket.disconnect()
    socket = null
  }
  const base = getApiBaseUrl()
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
