import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Lấy token từ API
    const getSocketToken = async () => {
      try {
        const response = await fetch("/api/socket-auth/token", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          return data.token;
        }
        return null;
      } catch (err) {
        console.error("Failed to get socket token:", err);
        return null;
      }
    };

    const initSocket = async () => {
      const token = await getSocketToken();
      if (!token) {
        console.log("No socket token found");
        return;
      }
    
      const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000", {
        auth: {
          token: token,
        },
        autoConnect: true,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        setConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
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
  }, [user]);

  return { socket, connected };
}
