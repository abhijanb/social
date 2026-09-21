import type { Socket } from "socket.io";
import {
  getChatNamespace,
  authenticateSocket,
} from "../../socket/socket.js";
import { sendMessage } from "./chat.service.js";

type SendAck = (res:
  | { ok: true; message: unknown }
  | { ok: false; error: string }) => void;

export function registerChatHandlers(): void {
  const namespace = getChatNamespace();

  namespace.on("connection", (client: Socket) => {
    const auth = authenticateSocket(client);
    if (!auth.authenticated) {
      client.disconnect();
      return;
    }
    const userId = auth.userId;
    (client.data as Record<string, unknown>).userId = userId;
    void client.join(`user:${userId}`);

    client.on(
      "chat:send",
      async (data: { to?: unknown; text?: unknown }, ack?: SendAck) => {
        const senderId = (client.data as Record<string, unknown>).userId as
          | string
          | undefined;
        if (!senderId) {
          if (typeof ack === "function")
            ack({ ok: false, error: "Not authenticated" });
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
          const message = await sendMessage(senderId, {
            receiverId: to,
            text,
          });
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
  });
}
