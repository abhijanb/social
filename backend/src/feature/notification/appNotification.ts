import type { NotificationType } from "../../generated/prisma/enums.js";
import { saveNotificationToDatabase } from "./notification.request.js";

export async function sendNotification(message: string, userId: string, type: NotificationType): Promise<unknown> {
  // Implementation for sending a notification
  // make service call to notification service or push notification service
  const notification = await saveNotificationToDatabase(userId, message, type);  
  return notification;
}


