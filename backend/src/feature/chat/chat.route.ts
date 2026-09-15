import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getHistoryController,
  sendMessageController,
} from "./chat.controller.js";

export const chatRouter = Router();

chatRouter.get("/history", requireAuth, getHistoryController);
chatRouter.post("/send", requireAuth, sendMessageController);
