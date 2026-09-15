import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { Namespace, Socket } from "socket.io";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  if (io) return io;
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });
  return io;
}

// Returns the shared Socket.IO server created by initSocket().
// Use this in any route/service file that needs to push realtime events,
// e.g. `getIo().to(`user:${id}`).emit("chat:receive", payload)`.
// Throws if called before index.ts has run initSocket(httpServer).
export function getIo(): Server {
  if (!io) {
    throw new Error(
      "Socket not initialized. Call initSocket(httpServer) in index.ts first.",
    );
  }
  return io;
}

// Returns the `/presence` namespace (online/offline status).
// Presence handlers emit here, e.g.
// `getPresenceNamespace().emit("presence:update", { userId, online: true })`,
// which the frontend presence socket listens to.
export function getPresenceNamespace(): Namespace {
  return getIo().of("/presence");
}

// Reads the JWT from a socket handshake: auth token first, then Bearer
// header, then the `token` cookie. Shared by every namespace gateway.
// Port of the Nest getTokenFromSocket helpers.
export function getTokenFromSocket(socket: Socket): string | null {
  const authToken = (socket.handshake.auth as Record<string, unknown>)?.token;
  if (typeof authToken === "string" && authToken) return authToken;
  const headerToken = socket.handshake.headers.authorization?.replace(
    /^Bearer\s+/i,
    "",
  );
  if (headerToken) return headerToken;
  const cookie = socket.handshake.headers.cookie;
  if (cookie) {
    for (const part of cookie.split(";")) {
      const [k, ...rest] = part.trim().split("=");
      if (k === "token") return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

// Returns the `/chat` namespace (direct messages).
// Chat handlers emit here, e.g.
// `getChatNamespace().to(`user:${id}`).emit("chat:receive", { message })`,
// which the frontend chat socket listens to.
export function getChatNamespace(): Namespace {
  return getIo().of("/chat");
}
