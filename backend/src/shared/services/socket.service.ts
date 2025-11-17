// backend/src/shared/services/socket.service.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Helper để đếm số người online (có userId)
export function getOnlineUsersCount(io: SocketIOServer): number {
  const sockets = io.sockets.sockets;
  const userIds = new Set<string>();
  sockets.forEach((socket: AuthenticatedSocket) => {
    if (socket.userId) {
      userIds.add(socket.userId);
    }
  });
  return userIds.size;
}

// Helper để emit online users count cho admin
function emitOnlineUsersCount(io: SocketIOServer) {
  const count = getOnlineUsersCount(io);
  io.to("admin").emit("admin:online-users-update", { onlineUsers: count });
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

    const joinAdminRoom = () => {
      socket.join("admin");
      emitOnlineUsersCount(io);
    };

    const parseSessionId = (
      payload: { sessionId?: string } | string | undefined
    ): string | undefined => {
      if (!payload) return undefined;
      if (typeof payload === "string") {
        return payload.trim();
      }
      if (typeof payload === "object") {
        const sessionId = payload.sessionId;
        return typeof sessionId === "string" ? sessionId.trim() : undefined;
      }
      return undefined;
    };

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
        // Emit update khi có user mới identify
        emitOnlineUsersCount(io);
      }
    });

    socket.on("join", ({ room }: { room?: string }) => {
      if (room && typeof room === "string") {
        socket.join(room);
        console.log("[socket] join", room, "by", socket.id);
        // Nếu join admin room, emit current count
        if (room === "admin") {
          emitOnlineUsersCount(io);
        }
      }
    });

    socket.on("admin:join", () => {
      joinAdminRoom();
    });

    socket.on(
      "user:join-conversation",
      (payload: { sessionId?: string } | string) => {
        const sessionId = parseSessionId(payload);
        if (!sessionId) return;
        socket.join(`admin-chat:${sessionId}`);
        console.log(
          "[socket] user joined admin-chat room",
          sessionId,
          "by",
          socket.id
        );
      }
    );

    socket.on(
      "user:leave-conversation",
      (payload: { sessionId?: string } | string) => {
        const sessionId = parseSessionId(payload);
        if (!sessionId) return;
        socket.leave(`admin-chat:${sessionId}`);
        console.log(
          "[socket] user left admin-chat room",
          sessionId,
          "by",
          socket.id
        );
      }
    );

    socket.on(
      "admin:join-conversation",
      (payload: { sessionId?: string } | string) => {
        const sessionId = parseSessionId(payload);
        if (!sessionId) return;

        if (sessionId === "admin") {
          joinAdminRoom();
          return;
        }

        socket.join(`admin-chat:${sessionId}`);
        socket.join("admin");
        console.log(
          "[socket] admin joined admin-chat room",
          sessionId,
          "by",
          socket.id
        );
      }
    );

    socket.on(
      "admin:leave-conversation",
      (payload: { sessionId?: string } | string) => {
        const sessionId = parseSessionId(payload);
        if (!sessionId) return;

        if (sessionId === "admin") {
          socket.leave("admin");
          emitOnlineUsersCount(io);
          return;
        }

        socket.leave(`admin-chat:${sessionId}`);
        console.log(
          "[socket] admin left admin-chat room",
          sessionId,
          "by",
          socket.id
        );
      }
    );

    socket.on("disconnect", () => {
      // Emit update khi có user disconnect
      setTimeout(() => {
        emitOnlineUsersCount(io);
      }, 100);
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
  io.to("admin").emit("admin-chat:new-message", data);
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

