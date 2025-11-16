// frontend/src/components/common/SocketBridge.tsx
"use client";
import React from "react";
import { getSocket } from "@/lib/socket";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function SocketBridge() {
  const joinedRef = React.useRef<{ community: boolean; user?: string }>({
    community: false,
  });

  React.useEffect(() => {
    const s = getSocket();

    const joinCommunity = () => {
      if (!joinedRef.current.community) {
        s.emit("join", { room: "community" });
        joinedRef.current.community = true;
        // console.log("[bridge] joined community");
      }
    };

    const identifyAndJoinUser = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/me`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok) return;
        const j = await r.json();
        const uid: string | undefined = j?.user?._id;
        if (!uid) return;

        // Tránh spam cùng một uid
        if (joinedRef.current.user === uid) {
          // vẫn identify lại trên reconnect để khôi phục room
          s.emit("identify", { userId: uid });
          s.emit("join", { room: `user:${uid}` });
          return;
        }

        // 1) identify để BE join phòng user:<uid> cho bạn
        s.emit("identify", { userId: uid });
        // 2) join trực tiếp phòng user:<uid> (phòng hờ race condition)
        s.emit("join", { room: `user:${uid}` });
        joinedRef.current.user = uid;
        // console.log("[bridge] joined user:", uid);
      } catch {}
    };

    const onConnect = () => {
      joinCommunity();
      identifyAndJoinUser();
    };

    // Nếu đã kết nối sẵn
    if (s.connected) onConnect();

    s.on("connect", onConnect);
    s.on("reconnect", onConnect);

    return () => {
      s.off("connect", onConnect);
      s.off("reconnect", onConnect);
    };
  }, []);

  return null;
}