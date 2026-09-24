import type { Socket } from "socket.io";
import { AppError } from "../../lib/errorHandler.js";
import { ensureCanView } from "../../lib/friends.js";
import { prisma } from "../../lib/prisma.js";
import {
  getLivestreamNamespace,
} from "../../socket/socket.js";
import {
  authenticateClient,
  handleDisconnect,
  handleJoin,
  handleMediaUpdate,
  handleSignal,
  type LivestreamSocketData,
} from "./livestream.socket.handlers.js";

export function streamRoom(streamId: string): string {
  return `stream:${streamId}`;
}

export type JoinAck = (
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

export function isSignalKind(value: unknown): value is SignalKind {
  return value === "offer" || value === "answer" || value === "ice";
}

export async function getJoinContext(
  userId: string,
  streamId: string,
): Promise<{ username: string }> {
  const stream = await prisma.livestream.findUnique({
    where: { id: streamId },
    select: { hostId: true, status: true },
  });
  if (!stream || stream.status !== "LIVE")
    throw new AppError("Stream ended or not found", 404);
  await ensureCanView(userId, stream.hostId, "Not friends with the host");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!user) throw new AppError("User not found", 404);
  return { username: user.username };
}

export function registerLivestreamHandlers(): void {
  const namespace = getLivestreamNamespace();

  namespace.on("connection", (client: Socket) => {
    const data = client.data as LivestreamSocketData;
    void (async () => {
      const userId = await authenticateClient(client, data);
      if (!userId) return;

    client.on(
      "livestream:join",
       (
         msg: { streamId?: unknown; audio?: unknown; video?: unknown },
         ack?: JoinAck,
       ) => {
         void handleJoin(namespace, client, data, userId, msg, ack);
       },
     );

    client.on(
      "livestream:signal",
      (msg: { to?: unknown; kind?: unknown; payload?: unknown }) => {
        void handleSignal(namespace, client, data, msg);
      },
    );

    client.on(
      "livestream:media-update",
      (msg: { audio?: unknown; video?: unknown }) => {
         void handleMediaUpdate(client, data, msg);
      },
    );

      client.on("disconnect", () => {
        handleDisconnect(namespace, client, data);
      });
    })();
  });
}

export function emitStreamEnded(streamId: string): void {
  getLivestreamNamespace()
    .to(streamRoom(streamId))
    .emit("livestream:ended", { streamId });
}