import { Request, Response } from "express";
import { Notification } from "../../shared/models/Notification";
import { Server as SocketIOServer } from "socket.io";

function getIO(): SocketIOServer | null {
  return (global as any).io || null;
}

export async function listMyNotifications(req: Request, res: Response) {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const limit = Math.min(parseInt(String(req.query.limit || 50), 10), 100);
  const items = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  const mapped = items.map((n) => ({
    id: String(n._id),
    type: n.type,
    message: n.message,
    link: n.link,
    createdAt: n.createdAt?.toISOString?.() || new Date().toISOString(),
    read: !!n.read,
  }));
  res.json({ items: mapped });
}

export async function clearMyNotifications(req: Request, res: Response) {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  await Notification.deleteMany({ userId }).exec();

  // bắn sự kiện để FE có thể tự clear nếu đang mở
  const io = getIO();
  if (io) io.to(`user:${userId}`).emit("notify:user:cleared", { ok: true });

  res.json({ ok: true });
}

export async function markAllRead(req: Request, res: Response) {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  await Notification.updateMany({ userId, read: false }, { $set: { read: true } }).exec();

  const io = getIO();
  if (io) io.to(`user:${userId}`).emit("notify:user:mark-all-read", { ok: true });

  res.json({ ok: true });
}

export async function createMyNotification(req: Request, res: Response) {
  const userId = (req as any).auth?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { message, link, type, meta } = (req.body || {}) as {
    message: string;
    link?: string;
    type?: "system" | "like" | "comment";
    meta?: any;
  };
  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "message is required" });
  }

  const doc = await Notification.create({
    userId,
    message,
    link: link || "#",
    type: type || "system",
    meta: meta || {},
  });

  const payload = {
    id: String(doc._id),
    type: doc.type as "system" | "like" | "comment",
    message: doc.message,
    link: doc.link || "#",
    createdAt: (doc.createdAt as Date)?.toISOString?.() || new Date().toISOString(),
    read: !!doc.read,
  };

  // bắn socket để Header chuông cập nhật realtime
  const io = getIO();
  if (io) io.to(`user:${userId}`).emit("notify:user", payload);

  res.json(payload);
}

export async function adminSendNotification(req: Request, res: Response) {
  const { emails, sendToAll, message, link, type } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const io = getIO();
  let count = 0;

  try {
    if (sendToAll) {
      // Gửi cho tất cả user
      const users = await import("../../shared/models/User").then(m => m.User.find({}).select("_id"));

      for (const user of users) {
        await import("./notification.service").then(s => s.notifyUser(io, {
          userId: String(user._id),
          message,
          link,
          type: type || "system",
        }));
        count++;
      }
    } else if (Array.isArray(emails) && emails.length > 0) {
      // Gửi cho danh sách email cụ thể
      const User = await import("../../shared/models/User").then(m => m.User);
      const users = await User.find({ email: { $in: emails } }).select("_id email");

      for (const user of users) {
        await import("./notification.service").then(s => s.notifyUser(io, {
          userId: String(user._id),
          message,
          link,
          type: type || "system",
        }));
        count++;
      }
    } else {
      return res.status(400).json({ message: "Must specify emails or sendToAll" });
    }

    res.json({ ok: true, count, message: `Sent to ${count} users` });
  } catch (error: any) {
    console.error("adminSendNotification error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}