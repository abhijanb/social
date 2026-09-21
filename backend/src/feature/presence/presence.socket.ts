import type { Socket } from "socket.io";
import {
  getPresenceNamespace,
  authenticateSocket,
} from "../../socket/socket.js";
import {
  getPresence,
  setOfflineBySocket,
  setOnline,
  touchPresence,
} from "./presence.service.js";

export function registerPresenceHandlers(): void {
  const namespace = getPresenceNamespace();

  namespace.on("connection", (client: Socket) => {
    const auth = authenticateSocket(client);
    if (!auth.authenticated) {
      client.disconnect();
      return;
    }
    const userId = auth.userId;
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