import type { Namespace, Socket } from "socket.io";
import { getTokenFromSocket } from "../../socket/socket.js";
import { verifyAuthToken } from "../../lib/jwt.js";
import {
  getJoinContext,
  isSignalKind,
  streamRoom,
  type JoinAck,
} from "./livestream.socket.js";

// Per-socket state for livestream peers (unknown until each step stamps it,
// runtime-checked at every read — same contract as the inline version).
export type LivestreamSocketData = {
  userId?: unknown;
  username?: unknown;
  streamId?: unknown;
  audio?: unknown;
  video?: unknown;
};

// Cookie-JWT auth preamble (like /chat). Stamps data.userId, disconnects
// and returns null on any failure.
export function authenticateClient(
  client: Socket,
  data: LivestreamSocketData,
): string | null {
  const token = getTokenFromSocket(client);
  if (!token) {
    client.disconnect();
    return null;
  }
  const payload = verifyAuthToken(token);
  if (!payload?.id) {
    client.disconnect();
    return null;
  }
  data.userId = payload.id;
  return payload.id;
}

export async function handleJoin(
  namespace: Namespace,
  client: Socket,
  data: LivestreamSocketData,
  userId: string,
  msg: { streamId?: unknown; audio?: unknown; video?: unknown },
  ack?: JoinAck,
): Promise<void> {
  const streamId =
    typeof msg?.streamId === "string" ? msg.streamId.trim() : "";
  if (!streamId) {
    if (typeof ack === "function")
      ack({ ok: false, error: "streamId required" });
    return;
  }
  // Initial mic/cam state so new peers render correct tiles
  // immediately (later flips arrive via livestream:media-update).
  const audio = msg?.audio === true;
  const video = msg?.video === true;
  try {
    const ctx = await getJoinContext(userId, streamId);
    const room = streamRoom(streamId);
    const existing = await namespace.in(room).fetchSockets();
    const peers = existing
      .filter((s) => s.id !== client.id)
      .map((s) => ({
        socketId: s.id,
        userId: String(s.data.userId ?? ""),
        username: String(s.data.username ?? ""),
        audio: s.data.audio === true,
        video: s.data.video === true,
      }))
      .filter((p) => p.userId.length > 0);
    data.username = ctx.username;
    data.streamId = streamId;
    data.audio = audio;
    data.video = video;
    await client.join(room);
    client.to(room).emit("livestream:peer-joined", {
      socketId: client.id,
      userId,
      username: ctx.username,
      audio,
      video,
    });
    if (typeof ack === "function") ack({ ok: true, peers });
  } catch (e: unknown) {
    if (typeof ack === "function")
      ack({
        ok: false,
        error: e instanceof Error ? e.message : "Failed to join",
      });
  }
}

// Opaque SDP/ICE relay — only between sockets sharing the joiner's
// stream room, so signals can't be sprayed at arbitrary sockets.
export function handleSignal(
  namespace: Namespace,
  client: Socket,
  data: LivestreamSocketData,
  msg: { to?: unknown; kind?: unknown; payload?: unknown },
): void {
  const to = typeof msg?.to === "string" ? msg.to : "";
  if (!to || !isSignalKind(msg?.kind)) return;
  if (msg?.payload === null || typeof msg?.payload !== "object") return;
  const streamId = data.streamId;
  if (typeof streamId !== "string" || !streamId) return;
  const room = streamRoom(streamId);
  if (!client.rooms.has(room)) return;
  const target = namespace.sockets.get(to);
  if (!target || !target.rooms.has(room)) return;
  target.emit("livestream:signal", {
    from: client.id,
    kind: msg.kind,
    payload: msg.payload,
  });
}

// Camera/mic on/off announcements (track.enabled flips need no
// renegotiation; peers just update tiles).
export function handleMediaUpdate(
  client: Socket,
  data: LivestreamSocketData,
  msg: { audio?: unknown; video?: unknown },
): void {
  const streamId = data.streamId;
  if (typeof streamId !== "string" || !streamId) return;
  const room = streamRoom(streamId);
  if (!client.rooms.has(room)) return;
  const audio = msg?.audio === true;
  const video = msg?.video === true;
  data.audio = audio;
  data.video = video;
  client.to(room).emit("livestream:peer-media", {
    socketId: client.id,
    audio,
    video,
  });
}

export function handleDisconnect(
  namespace: Namespace,
  client: Socket,
  data: LivestreamSocketData,
): void {
  const streamId = data.streamId;
  if (typeof streamId !== "string" || !streamId) return;
  namespace
    .to(streamRoom(streamId))
    .emit("livestream:peer-left", { socketId: client.id });
}
