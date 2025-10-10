import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
  isAdmin?: boolean;
}

export function setupSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: [process.env.CLIENT_URL || "http://localhost:3000", process.env.ADMIN_URL || "http://localhost:3001"],
      credentials: true,
    },
  });

  // Middleware để xác thực socket
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Lấy token từ query hoặc handshake
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token) {
        return next(new Error("Authentication error"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
      
      // Lấy thông tin user
      const user = await User.findById(decoded.userId).select("role");
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = decoded.userId;
      socket.role = user.role;
      socket.isAdmin = user.role === "admin";
      
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.role})`);

    // Admin join admin room
    if (socket.isAdmin) {
      socket.join("admin");
      console.log(`Admin ${socket.userId} joined admin room`);
    }

    // User join their own room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Handle admin chat events
    socket.on("admin:join-conversation", (sessionId: string) => {
      if (socket.isAdmin) {
        socket.join(`conversation:${sessionId}`);
        console.log(`Admin ${socket.userId} joined conversation ${sessionId}`);
      }
    });

    socket.on("admin:leave-conversation", (sessionId: string) => {
      if (socket.isAdmin) {
        socket.leave(`conversation:${sessionId}`);
        console.log(`Admin ${socket.userId} left conversation ${sessionId}`);
      }
    });

    // Handle user chat events
    socket.on("user:join-conversation", async (sessionId: string) => {
      if (socket.userId) {
        // Lấy thông tin user để có email
        const User = require("../models/User").User;
        const user = await User.findById(socket.userId).select("email");
        if (!user) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        // Cho phép user join conversation room ngay cả khi chưa có tin nhắn
        // Chỉ cần kiểm tra sessionId có format đúng không
        if (sessionId && sessionId.startsWith(`admin_session_${socket.userId}_`)) {
          socket.join(`conversation:${sessionId}`);
          console.log(`User ${user.email} joined conversation ${sessionId}`);
        } else {
          console.log(`User ${user.email} denied access to conversation ${sessionId}`);
          socket.emit("error", { message: "Access denied to this conversation" });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}

// Helper function để emit tin nhắn mới
export function emitNewMessage(io: SocketIOServer, sessionId: string, message: any) {
  io.to(`conversation:${sessionId}`).emit("new-message", message);
}

// Helper function để emit tin nhắn admin
export function emitAdminMessage(io: SocketIOServer, sessionId: string, message: any) {
  io.to(`conversation:${sessionId}`).emit("admin-message", message);
  io.to("admin").emit("conversation-updated", { sessionId, message });
}

// Helper function để emit cập nhật danh sách cuộc trò chuyện
export function emitConversationUpdate(io: SocketIOServer, conversation: any) {
  io.to("admin").emit("conversation-updated", conversation);
}
