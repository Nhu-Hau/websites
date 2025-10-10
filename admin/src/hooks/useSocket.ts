import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Lấy token từ API
    const getSocketToken = async () => {
      try {
        const response = await fetch("/api/socket-auth/admin-token", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          return data.token;
        }
        return null;
      } catch (err) {
        console.error("Failed to get admin socket token:", err);
        return null;
      }
    };

    const initSocket = async () => {
      const token = await getSocketToken();
      if (!token) {
        console.log("No admin socket token found");
        return;
      }

      console.log("Admin socket: Initializing with token:", token);

      const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000", {
        auth: {
          token: token,
        },
        autoConnect: true,
      });

      newSocket.on("connect", () => {
        console.log("Admin socket connected");
        setConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Admin socket disconnected");
        setConnected(false);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Admin socket connection error:", err);
        setConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      };
    };

    initSocket();
  }, []);

  return { socket, connected };
}
