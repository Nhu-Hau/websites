import { Server as SocketIOServer } from "socket.io";
import { Notification } from "../../shared/models/Notification";

export async function notifyUser(
  io: SocketIOServer,
  payload: {
    userId: string;
    message: string;
    link?: string;
    type?: "like" | "comment" | "system";
    meta?: any;
  }
) {
  const doc = await Notification.create({
    userId: payload.userId,
    type: payload.type || "system",
    message: payload.message,
    link: payload.link || "#",
    meta: payload.meta || {},
  });

  const id = String(doc._id);

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

  return doc;
}
