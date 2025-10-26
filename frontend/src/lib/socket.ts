// frontend/src/lib/socket.ts
"use client";

import { io, Socket } from "socket.io-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

// Singleton socket — mọi nơi import sẽ dùng CÙNG 1 socket
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(API_BASE, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
  });

  // Log nhẹ để debug (có thể xoá nếu muốn)
  socket.on("connect", () => {
    console.log("[socket] connected", socket?.id);
  });
  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  return socket;
}