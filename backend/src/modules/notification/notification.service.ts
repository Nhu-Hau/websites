import { Server as SocketIOServer } from "socket.io";
import { Notification } from "../../shared/models/Notification";

export async function notifyUser(
  io: SocketIOServer | null,
  payload: {
    userId: string;
    message: string;
    link?: string;
    type?: "like" | "comment" | "follow" | "mention" | "reaction" | "repost" | "group_invite" | "group_post" | "system";
    meta?: any;
    fromUserId?: string;
  }
) {
  if (!io) {
    console.warn("[notifyUser] Socket.IO not available");
    return null;
  }

  console.log("[notifyUser] Creating notification:", {
    userId: payload.userId,
    type: payload.type,
    message: payload.message,
  });

  const doc = await Notification.create({
    userId: payload.userId,
    type: payload.type || "system",
    message: payload.message,
    link: payload.link || "#",
    meta: payload.meta || {},
    fromUserId: payload.fromUserId || null,
  });

  const id = String(doc._id);

  console.log(`[notifyUser] Emitting to room: user:${payload.userId}, notificationId: ${id}`);

  // dropdown chuông
  io.to(`user:${payload.userId}`).emit("notify:user", {
    id,
    type: doc.type,
    message: doc.message,
    link: doc.link,
    createdAt: doc.createdAt.toISOString(),
    read: false,
  });

  // corner toast
  io.to(`user:${payload.userId}`).emit("corner-toast", {
    id,
    title: "Thông báo",
    message: doc.message,
    link: doc.link,
  });

  console.log("[notifyUser] Notification sent successfully");

  return doc;
}
