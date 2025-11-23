"use client";

import Link from "next/link";
import { useSocket } from "@/hooks/useSocket";
import { useState, useEffect, useCallback } from "react";

export default function AdminChatLink() {
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Tải số lượng tin nhắn chưa đọc
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/admin-chat/admin/conversations", {
        credentials: "include",
      });
      const data = await response.json();

      if (data?.data) {
        // Tính tổng unread count từ tất cả conversations
        const totalUnread = (data.data || []).reduce((sum: number, conv: { unreadCount?: number }) =>
          sum + (conv.unreadCount || 0), 0
        );
        setUnreadCount(totalUnread);
      }
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  }, []);

  // Tải số lượng tin nhắn chưa đọc khi component mount
  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Lắng nghe sự kiện admin đã xem tin nhắn
  useEffect(() => {
    console.log("AdminChatLink: Setting up admin-viewed-messages event listener");

    const handleAdminViewedMessages = (event: CustomEvent) => {
      console.log("AdminChatLink: Received admin-viewed-messages event:", event.detail);
      console.log("AdminChatLink: Admin viewed messages, reloading unread count");

      // Reset unread count ngay lập tức
      setUnreadCount(0);

      // Reload unread count để cập nhật chính xác
      loadUnreadCount();
    };

    window.addEventListener('admin-viewed-messages', handleAdminViewedMessages as EventListener);

    return () => {
      console.log("AdminChatLink: Cleaning up admin-viewed-messages event listener");
      window.removeEventListener('admin-viewed-messages', handleAdminViewedMessages as EventListener);
    };
  }, [loadUnreadCount]);

  // Lắng nghe real-time
  useEffect(() => {
    if (!socket) {
      console.log("AdminChatLink: No socket available");
      return;
    }

    console.log("AdminChatLink: Setting up socket listeners");

    // Join admin room để nhận tin nhắn
    socket.emit("admin:join-conversation", "admin");

    const handleNewMessage = (data: { message?: { role?: string } }) => {
      console.log("Admin navigation received new-message:", data);
      if (data.message && data.message.role === 'user') {
        console.log("Admin navigation: Incrementing unread count");
        setUnreadCount(prev => prev + 1);

        // Reload unread count để cập nhật chính xác
        loadUnreadCount();
      }
    };

    const handleConversationUpdate = (_data: unknown) => {
      console.log("Admin navigation received conversation-updated:", _data);
      // Tải lại số tin nhắn chưa đọc khi conversation được cập nhật
      loadUnreadCount();
    };

    socket.on("admin-chat:new-message", handleNewMessage);
    socket.on("admin-chat:conversation-updated", handleConversationUpdate);

    return () => {
      console.log("AdminChatLink: Cleaning up socket listeners");
      socket.off("admin-chat:new-message", handleNewMessage);
      socket.off("admin-chat:conversation-updated", handleConversationUpdate);
      socket.emit("admin:leave-conversation", "admin");
    };
  }, [socket, loadUnreadCount]);

  return (
    <Link href="/admin-chat" className="hover:underline relative">
      Admin Chat
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
