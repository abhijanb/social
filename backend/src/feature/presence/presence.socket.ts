import type { Socket } from "socket.io";
import { verifyToken } from "../../lib/jwt.js";
import {
  getPresenceNamespace,
  getTokenFromSocket,
} from "../../socket/socket.js";
import {
  getPresence,
  setOfflineBySocket,
  setOnline,
  touchPresence,
} from "./presence.service.js";

// Registers the /presence namespace handlers. Port of PresenceGateway:
// authenticated sockets mark the user online and every connect/disconnect
// broadcasts presence:update; heartbeat keeps lastSeen fresh.
export function registerPresenceHandlers(): void {
  const namespace = getPresenceNamespace();

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
    (client.data as Record<string, unknown>).userId = userId;
    setOnline(userId, client.id);
    void client.join(`user:${userId}`);
    namespace.emit("presence:update", {
      userId,
      online: true,
      lastSeenAt: null,
    });

    client.on("disconnect", () => {
      const result = setOfflineBySocket(client.id);
      if (result?.wentOffline) {
        namespace.emit("presence:update", getPresence(result.userId));
      }
    });

    client.on(
      "presence:heartbeat",
      (ack?: (res: { ok: boolean }) => void) => {
        const id = (client.data as Record<string, unknown>).userId as
          | string
          | undefined;
        if (id) touchPresence(id);
        if (typeof ack === "function") ack({ ok: true });
      },
    );

    client.on("presence:ping", (ack?: (res: { ok: boolean }) => void) => {
      if (typeof ack === "function") ack({ ok: true });
    });
  });
}
