import type { Socket } from "socket.io";
import {
  getChatNamespace,
  authenticateSocket,
  sessionRoom,
} from "../../socket/socket.js";
import { getLiveSession } from "../../lib/sessions.js";
import { sendMessage } from "./chat.service.js";

type SendAck = (res:
  | { ok: true; message: unknown }
  | { ok: false; error: string }) => void;

export function registerChatHandlers(): void {
  const namespace = getChatNamespace();

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
      void client.join(`user:${userId}`);
      void client.join(sessionRoom(auth.jti));

    client.on(
      "chat:send",
      async (
        data: { to?: unknown; text?: unknown; idempotencyKey?: unknown },
        ack?: SendAck,
      ) => {
        const data0 = client.data as Record<string, unknown>;
        const senderId = data0.userId as string | undefined;
        const senderJti = data0.jti as string | undefined;
        if (!senderId || !senderJti) {
          if (typeof ack === "function")
            ack({ ok: false, error: "Not authenticated" });
          return;
        }
        // Re-validate per message — a session revoked after connect must
        // not keep sending. Cheap (one indexed lookup per user action).
        const live = await getLiveSession(senderJti, senderId);
        if (!live) {
          if (typeof ack === "function")
            ack({ ok: false, error: "Not authenticated" });
          client.disconnect();
          return;
        }
        const to = typeof data?.to === "string" ? data.to.trim() : "";
        const text = typeof data?.text === "string" ? data.text.trim() : "";
        if (!to || !text) {
          if (typeof ack === "function")
            ack({ ok: false, error: "Invalid payload" });
          return;
        }
        try {
          const idempotencyKey =
            typeof data?.idempotencyKey === "string" ? data.idempotencyKey : undefined;
          const message = await sendMessage(senderId, {
            receiverId: to,
            text,
          }, idempotencyKey);
          namespace.to(`user:${to}`).emit("chat:receive", { message });
          namespace.to(`user:${senderId}`).emit("chat:receive", { message });
          if (typeof ack === "function") ack({ ok: true, message });
        } catch (e: unknown) {
          if (typeof ack === "function")
            ack({
              ok: false,
              error: e instanceof Error ? e.message : "Failed to send",
            });
        }
      },
    );
    })();
  });
}
