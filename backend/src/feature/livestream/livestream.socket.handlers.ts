import type { Namespace, Socket } from "socket.io";
import { getTokenFromSocket } from "../../socket/socket.js";
import { verifyAuthToken } from "../../lib/jwt.js";
import { getLiveSession } from "../../lib/sessions.js";
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

// Cookie-JWT auth preamble (like /chat). Stamps data.userId + data.jti,
// disconnects and returns null on any failure. Async: rejects
// revoked/expired sessions.
export async function authenticateClient(
  client: Socket,
  data: LivestreamSocketData,
): Promise<{ userId: string; jti: string } | null> {
  const token = getTokenFromSocket(client);
  if (!token) {
    client.disconnect();
    return null;
  }
  const payload = verifyAuthToken(token);
  if (!payload?.id || !payload?.jti) {
    client.disconnect();
    return null;
  }
  const session = await getLiveSession(payload.jti, payload.id);
  if (!session) {
    client.disconnect();
    return null;
  }
  data.userId = payload.id;
  (data as Record<string, unknown>).jti = payload.jti;
  return { userId: payload.id, jti: payload.jti };
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
  // Re-validate the session at join — join is user-initiated (not a hot
  // path like ICE), so one lookup here keeps revoked peers out of rooms.
  // Signal/media-update rely on push-kill (see disconnectSessionSockets).
  const jti = (data as Record<string, unknown>).jti;
  if (typeof jti === "string" && jti) {
    const live = await getLiveSession(jti, userId);
    if (!live) {
      if (typeof ack === "function")
        ack({ ok: false, error: "Not authenticated" });
      client.disconnect();
      return;
    }
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
