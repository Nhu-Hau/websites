"use client";

import React from "react";
import { FaUserTie } from "react-icons/fa";
import { FiSend, FiMessageSquare } from "react-icons/fi";
import { useSocket } from "../../hooks/useSocket";

interface Conversation {
  _id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  } | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageRole: string;
  unreadCount: number;
}

interface Message {
  _id: string;
  userEmail: string;
  adminEmail?: string;
  role: "user" | "admin";
  content: string;
  sessionId: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminChatPage() {
  const { socket } = useSocket();
  const [me, setMe] = React.useState<{ id: string; role?: string } | null>(null);
  const [loadingMe, setLoadingMe] = React.useState(true);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin-auth/me", { credentials: "include", cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setMe({ id: j?.id, role: j?.role });
        } else {
          setMe(null);
        }
      } finally {
        setLoadingMe(false);
      }
    })();
  }, []);

  // Load conversations
  const loadConversations = React.useCallback(async () => {
    if (me?.role !== 'admin') return;
    try {
      const response = await fetch("/api/admin-chat/admin/conversations", {
        credentials: "include",
      });
      const data = await response.json();
      setConversations(data.data || []);
      
      // Tính tổng unread count từ tất cả conversations
      const totalUnread = (data.data || []).reduce((sum: number, conv: any) => 
        sum + (conv.unreadCount || 0), 0
      );
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, [me]);

  // Load messages for selected conversation
  const loadMessages = React.useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    console.log("Loading messages for sessionId:", sessionId);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin-chat/admin/messages/${sessionId}`, {
        credentials: "include",
      });
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Messages data:", data);
      
      // Loại bỏ tin nhắn trùng lặp dựa trên _id
      const uniqueMessages = (data.data || []).filter((msg: Message, index: number, self: Message[]) => 
        index === self.findIndex(m => m._id === msg._id)
      );
      
      console.log("Unique messages:", uniqueMessages);
      setMessages(uniqueMessages);
      
      // Reset unread count khi admin xem tin nhắn
      setUnreadCount(0);
      
      // Cập nhật conversations để reset unread count cho conversation này
      setConversations(prev => prev.map(conv => 
        conv._id === sessionId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      
      // Reload conversations để cập nhật unread count
      loadConversations();
      
      // Thông báo cho AdminChatLink component
      console.log("AdminChatPage: Dispatching admin-viewed-messages event for sessionId:", sessionId);
      window.dispatchEvent(new CustomEvent('admin-viewed-messages', { 
        detail: { sessionId } 
      }));
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (me?.role === 'admin') {
      loadConversations();
    }
  }, [me, loadConversations]);

  React.useEffect(() => {
    console.log("Selected conversation changed:", selectedConversation);
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, loadMessages]);

  // Real-time listeners
  React.useEffect(() => {
    if (!socket) {
      console.log("Admin chat page: No socket available");
      return;
    }

    console.log("Admin chat page: Setting up socket listeners");
    
    // Join admin room để nhận tin nhắn
    socket.emit("admin:join-conversation", "admin");

    const handleNewMessage = (data: any) => {
      console.log("Admin chat page received new-message:", data);
      if (data.message) {
        const newMessage: Message = {
          _id: data.message._id,
          userEmail: data.message.userEmail,
          adminEmail: data.message.adminEmail,
          role: data.message.role,
          content: data.message.content,
          sessionId: data.message.sessionId,
          isRead: data.message.isRead,
          createdAt: data.message.createdAt,
        };
        setMessages(prev => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) {
            console.log("Message already exists, skipping:", newMessage._id);
            return prev;
          }
          return [...prev, newMessage];
        });
        
        // Tăng unread count nếu tin nhắn từ user
        if (data.message.role === 'user') {
          console.log("Admin chat page: Incrementing unread count");
          setUnreadCount(prev => prev + 1);
          
          // Cập nhật conversations để tăng unread count cho conversation này
          setConversations(prev => prev.map(conv => 
            conv._id === data.message.sessionId 
              ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
              : conv
          ));
          
          // Reload conversations để cập nhật unread count
          loadConversations();
        }
      }
    };

    const handleAdminMessage = (data: any) => {
      console.log("Admin received admin-message:", data);
      if (data.message) {
        const newMessage: Message = {
          _id: data.message._id,
          userEmail: data.message.userEmail,
          adminEmail: data.message.adminEmail,
          role: data.message.role,
          content: data.message.content,
          sessionId: data.message.sessionId,
          isRead: data.message.isRead,
          createdAt: data.message.createdAt,
        };
        setMessages(prev => {
          // Kiểm tra xem tin nhắn đã tồn tại chưa
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) {
            console.log("Message already exists, skipping:", newMessage._id);
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    const handleConversationUpdate = (data: any) => {
      // Reload conversations when there's an update
      loadConversations();
    };

    // Join admin room để nhận tin nhắn từ tất cả conversations
    socket.emit("admin:join-conversation", "admin");

    socket.on("new-message", handleNewMessage);
    socket.on("admin-message", handleAdminMessage);
    socket.on("conversation-updated", handleConversationUpdate);

    return () => {
      console.log("Admin chat page: Cleaning up socket listeners");
      socket.off("new-message", handleNewMessage);
      socket.off("admin-message", handleAdminMessage);
      socket.off("conversation-updated", handleConversationUpdate);
      socket.emit("admin:leave-conversation", "admin");
    };
  }, [socket, loadConversations]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;
    
    setSending(true);
    try {
      const response = await fetch("/api/admin-chat/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: newMessage.trim(),
          sessionId: selectedConversation,
        }),
      });
      
      if (response.ok) {
        setNewMessage("");
        // Reload messages to show the new message
        loadMessages(selectedConversation);
        // Reload conversations to update last message
        loadConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaUserTie className="h-6 w-6" />
            Quản lý Chat với Admin
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Trả lời tin nhắn từ người dùng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Cuộc trò chuyện</h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv._id)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 ${
                      selectedConversation === conv._id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conv.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.user?.email || conv.userId}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.lastMessage}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(conv.lastMessageAt).toLocaleString()}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Cuộc trò chuyện với {conversations.find(c => c._id === selectedConversation)?.user?.name || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {conversations.find(c => c._id === selectedConversation)?.user?.email}
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      Đang tải tin nhắn...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      Chưa có tin nhắn nào
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            msg.role === "admin"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {msg.role === "admin" ? (
                              <FaUserTie className="h-3 w-3" />
                            ) : (
                              <FiMessageSquare className="h-3 w-3" />
                            )}
                            <span className="text-xs font-medium">
                              {msg.role === "admin" ? "Admin" : "User"}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn trả lời..."
                      rows={2}
                      className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                      ) : (
                        <FiSend className="h-4 w-4" />
                      )}
                      Gửi
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Chọn một cuộc trò chuyện để xem tin nhắn
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
