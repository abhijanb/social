import type { Socket } from "socket.io";
import { AppError } from "../../lib/errorHandler.js";
import { verifyToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import {
  getLivestreamNamespace,
  getTokenFromSocket,
} from "../../socket/socket.js";

// Socket.IO room holding every peer watching/publishing one stream.
export function streamRoom(streamId: string): string {
  return `stream:${streamId}`;
}

type JoinAck = (
  res:
    | {
        ok: true;
        peers: {
          socketId: string;
          userId: string;
          username: string;
          audio: boolean;
          video: boolean;
        }[];
      }
    | { ok: false; error: string },
) => void;

type SignalKind = "offer" | "answer" | "ice";

function isSignalKind(value: unknown): value is SignalKind {
  return value === "offer" || value === "answer" || value === "ice";
}

// Shared with the REST guards: the stream must be LIVE and the user must
// be the host or an ACCEPTED friend of the host. Returns the username for
// peer announcements.
async function getJoinContext(
  userId: string,
  streamId: string,
): Promise<{ username: string }> {
  const stream = await prisma.livestream.findUnique({
    where: { id: streamId },
    select: { hostId: true, status: true },
  });
  if (!stream || stream.status !== "LIVE")
    throw new AppError("Stream ended or not found", 404);
  if (userId !== stream.hostId) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId, addresseeId: stream.hostId },
          { requesterId: stream.hostId, addresseeId: userId },
        ],
      },
    });
    if (!friendship) throw new AppError("Not friends with the host", 403);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return { username: user.username };
}

// Registers the /livestream namespace handlers: WebRTC signaling relay
// for live video rooms. The server never touches media — it authenticates
// (cookie JWT, like /chat), authorizes (friends-only per stream), tracks
// room membership, and forwards offers/answers/ICE between peers.
// Mesh topology: every peer connects to every other peer.
export function registerLivestreamHandlers(): void {
  const namespace = getLivestreamNamespace();

  namespace.on("connection", (client: Socket) => {
    const token = getTokenFromSocket(client);
    if (!token) {
      client.disconnect();
      return;
    }
    const payload = verifyToken(token);
    if (!payload?.id) {
      client.disconnect();
      return;
    }
    const userId = payload.id;
    const data = client.data as Record<string, unknown>;
    data.userId = userId;

    client.on(
      "livestream:join",
      async (
        msg: { streamId?: unknown; audio?: unknown; video?: unknown },
        ack?: JoinAck,
      ) => {
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
      },
    );

    // Opaque SDP/ICE relay — only between sockets sharing the joiner's
    // stream room, so signals can't be sprayed at arbitrary sockets.
    client.on(
      "livestream:signal",
      (msg: { to?: unknown; kind?: unknown; payload?: unknown }) => {
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
      },
    );

    // Camera/mic on/off announcements (track.enabled flips need no
    // renegotiation; peers just update tiles).
    client.on(
      "livestream:media-update",
      (msg: { audio?: unknown; video?: unknown }) => {
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
      },
    );

    client.on("disconnect", () => {
      const streamId = data.streamId;
      if (typeof streamId !== "string" || !streamId) return;
      namespace
        .to(streamRoom(streamId))
        .emit("livestream:peer-left", { socketId: client.id });
    });
  });
}

// Tells every peer in a stream room that the host ended it so clients
// tear down their peer connections (called from the REST end controller;
// the 404 comment poll is the fallback signal).
export function emitStreamEnded(streamId: string): void {
  getLivestreamNamespace()
    .to(streamRoom(streamId))
    .emit("livestream:ended", { streamId });
}
