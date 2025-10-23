// frontend/src/hooks/useSocket.ts
"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

export function useSocket(): { socket: Socket; connected: boolean } {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socket = getSocket(); // ✅ luôn dùng singleton

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      // join các room cần thiết mỗi lần connect/reconnect
      socket.emit("join", { room: "community" });
      if (user?.id) {
        socket.emit("identify", { userId: user.id });
        socket.emit("join", { room: `user:${user.id}` });
      }
    };
    const onDisconnect = () => setConnected(false);

    // gọi ngay nếu đã kết nối
    if (socket.connected) onConnect();

    socket.on("connect", onConnect);
    socket.on("reconnect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("reconnect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, user?.id]);

  return { socket, connected };
}