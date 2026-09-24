import type { Socket } from "socket.io";
import {
  getPresenceNamespace,
  authenticateSocket,
  sessionRoom,
} from "../../socket/socket.js";
import { getFriendIds } from "../../lib/friends.js";
import { getLiveSession } from "../../lib/sessions.js";
import {
  getPresence,
  setOfflineBySocket,
  setOnline,
  touchPresence,
} from "./presence.service.js";

// Online/offline transitions are friends-only: emit into the personal
// rooms (`user:<id>`) of self + ACCEPTED friends instead of broadcasting
// to the whole namespace (strangers must not learn them). The REST
// counterpart (GET /presence?ids=) applies the same scope.
async function emitScoped(
  namespace: ReturnType<typeof getPresenceNamespace>,
  userId: string,
  payload: ReturnType<typeof getPresence>,
): Promise<void> {
  let friendIds: string[] = [];
  try {
    friendIds = await getFriendIds(userId);
  } catch {
    // DB hiccup — still notify self rather than dropping the event.
  }
  for (const id of [userId, ...friendIds]) {
    namespace.to(`user:${id}`).emit("presence:update", payload);
  }
}

export function registerPresenceHandlers(): void {
  const namespace = getPresenceNamespace();

  namespace.on("connection", (client: Socket) => {
    void (async () => {
      const auth = await authenticateSocket(client);
      if (!auth.authenticated) {
        client.disconnect();
        return;
      }
      const userId = auth.userId;
      (client.data as Record<string, unknown>).userId = userId;
      (client.data as Record<string, unknown>).jti = auth.jti;
      setOnline(userId, client.id);
      void client.join(`user:${userId}`);
      void client.join(sessionRoom(auth.jti));
      void emitScoped(namespace, userId, {
        userId,
        online: true,
        lastSeenAt: null,
      });

      client.on("disconnect", () => {
        const result = setOfflineBySocket(client.id);
        if (result?.wentOffline) {
          void emitScoped(namespace, result.userId, getPresence(result.userId));
        }
      });

      client.on("presence:heartbeat", (ack?: (res: { ok: boolean }) => void) => {
        void (async () => {
          const data = client.data as Record<string, unknown>;
          const id = data.userId as string | undefined;
          const jti = data.jti as string | undefined;
          // Re-validate the session on heartbeat — a revoked session must
          // not linger as online forever between push-kill and reconnect.
          if (id && jti) {
            const session = await getLiveSession(jti, id);
            if (!session) {
              const result = setOfflineBySocket(client.id);
              if (result?.wentOffline) {
                void emitScoped(namespace, result.userId, getPresence(result.userId));
              }
              client.disconnect();
              return;
            }
          }
          if (id) touchPresence(id);
          if (typeof ack === "function") ack({ ok: true });
        })();
      });

      client.on("presence:ping", (ack?: (res: { ok: boolean }) => void) => {
        if (typeof ack === "function") ack({ ok: true });
      });
    })();
  });
}