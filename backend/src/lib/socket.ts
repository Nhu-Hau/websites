import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:3000",
        process.env.ADMIN_URL || "http://localhost:3001",
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    socket.join("community");
    console.log("[socket] connected", socket.id);

    socket.on("identify", ({ userId }: { userId?: string }) => {
      if (userId && typeof userId === "string") {
        socket.userId = userId;
        socket.join(`user:${userId}`);
        console.log(
          "[socket] identify -> join room",
          `user:${userId}`,
          "by",
          socket.id
        );
      }
    });

    socket.on("join", ({ room }: { room: string }) => {
      if (room && typeof room === "string") {
        socket.join(room);
        console.log("[socket] join", room, "by", socket.id);
      }
    });
  });

  (global as any).io = io;
  return io;
}

/* ============ Emit helpers (community) ============ */
export function emitCommunityNewPost(io: SocketIOServer, post: any) {
  io.to("community").emit("community:new-post", post);
}

export function emitCommunityNewComment(
  io: SocketIOServer,
  postId: string,
  comment: any
) {
  io.to(`post:${postId}`).emit("community:new-comment", { postId, comment });
  io.except(`post:${postId}`)
    .to("community")
    .emit("community:new-comment", { postId, comment });
}

export function emitCommunityLike(
  io: SocketIOServer,
  postId: string,
  payload: { likesCount: number; liked: boolean; userId?: string }
) {
  io.to(`post:${postId}`).emit("community:like-updated", {
    postId,
    ...payload,
  });
  io.except(`post:${postId}`)
    .to("community")
    .emit("community:like-updated", { postId, ...payload });
}

export function emitCommunityPostDeleted(io: SocketIOServer, postId: string) {
  io.to(`post:${postId}`).emit("community:post-deleted", { postId });
  io.except(`post:${postId}`)
    .to("community")
    .emit("community:post-deleted", { postId });
}

export function emitCommunityCommentDeleted(
  io: SocketIOServer,
  postId: string,
  commentId: string
) {
  io.to(`post:${postId}`).emit("community:comment-deleted", {
    postId,
    commentId,
  });
  io.except(`post:${postId}`)
    .to("community")
    .emit("community:comment-deleted", { postId, commentId });
}

/* ============ Emit helpers (notifications) ============ */
type AllowedNotifyType = "like" | "comment" | "progress";

export function emitNotifyUser(
  io: SocketIOServer,
  userId: string,
  data: { message: string; link: string; type: AllowedNotifyType; meta?: any }
) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // dropdown ở Header
  io.to(`user:${userId}`).emit("notify:user", {
    id,
    message: data.message,
    link: data.link,
    type: data.type,
    createdAt: new Date().toISOString(),
    read: false,
    extra: data.meta || undefined,
  });

  // corner toast (FE có thể dùng hoặc bỏ qua — tuỳ hook hiện tại)
  io.to(`user:${userId}`).emit("corner-toast", {
    id,
    title:
      data.type === "comment"
        ? "Bình luận mới"
        : data.type === "like"
        ? "Lượt thích mới"
        : "Gợi ý làm Progress Test",
    message: data.message,
    link: data.link,
  });
}

// Sugar cho progress
export function emitNotifyProgress(
  io: SocketIOServer,
  userId: string,
  message: string,
  link: string,
  meta?: any
) {
  return emitNotifyUser(io, userId, { type: "progress", message, link, meta });
}

/* ============ Emit helpers (admin chat) ============ */
export function emitNewMessage(
  io: SocketIOServer,
  sessionId: string,
  data: { message: any; type: string }
) {
  io.to(`admin-chat:${sessionId}`).emit("admin-chat:new-message", data);
}

export function emitAdminMessage(
  io: SocketIOServer,
  sessionId: string,
  data: { message: any; type: string }
) {
  io.to(`admin-chat:${sessionId}`).emit("admin-chat:admin-message", data);
}

export function emitConversationUpdate(io: SocketIOServer, sessionId: string) {
  io.to("admin").emit("admin-chat:conversation-updated", { sessionId });
}