import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { authRouter } from "./feature/auth/auth.route.js";
import { chatRouter } from "./feature/chat/chat.route.js";
import { registerChatHandlers } from "./feature/chat/chat.socket.js";
import { friendshipRouter } from "./feature/friendship/friendship.route.js";
import { registerLivestreamHandlers } from "./feature/livestream/livestream.socket.js";
import { livestreamRouter } from "./feature/livestream/livestream.route.js";
import { notificationRouter } from "./feature/notification/notification.route.js";
import { postRouter } from "./feature/post/post.route.js";
import { presenceRouter } from "./feature/presence/presence.route.js";
import { registerPresenceHandlers } from "./feature/presence/presence.socket.js";
import { storyRouter } from "./feature/story/story.route.js";
import { userRouter } from "./feature/user/user.route.js";
import { errorMiddleware } from "./middleware/error.js";
import { startSchedules } from "./schedule/core/scheduler.js";
import { schedules } from "./schedule/jobs/index.js";
import {
  getChatNamespace,
  getLivestreamNamespace,
  getPresenceNamespace,
  initSocket,
} from "./socket/socket.js";

export const app = express();

app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Uploaded post images live in backend/uploads/ and are served at /uploads/*
// (same contract as back/src/main.ts).
mkdirSync(join(process.cwd(), "uploads"), { recursive: true });
app.use("/uploads", express.static(join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "hello from express" });
});

app.use("/user", authRouter);
// Mounted after auth so GET /user/me wins over GET /user/:id.
app.use("/user", userRouter);

app.use("/friendship", friendshipRouter);

app.use("/chat", chatRouter);

app.use("/presence", presenceRouter);

app.use("/post", postRouter);

app.use("/story", storyRouter);

app.use("/livestream", livestreamRouter);

app.use("/notification", notificationRouter);

// Final error middleware — must stay last, after all routers.
app.use(errorMiddleware);

export const httpServer = createServer(app);

export const io = initSocket(httpServer);

// Namespaces are placeholders for now — presence/chat handlers come next,
// ported from back/src/presence/presence.gateway.ts and back/src/chat/chat.gateway.ts.
export const presenceNamespace = getPresenceNamespace();
export const chatNamespace = getChatNamespace();
export const livestreamNamespace = getLivestreamNamespace();

registerPresenceHandlers();
registerChatHandlers();
registerLivestreamHandlers();

// Cron schedules (story expiry + soft-delete purge daily 2am).
// Overlap-safe, unref'd — no intervals.
startSchedules(schedules);

const rawPort = (process.env.PORT ?? "").trim();
const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
const port =
  Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535
    ? parsedPort
    : 3000;

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});
