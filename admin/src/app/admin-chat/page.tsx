/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { FaUserTie } from "react-icons/fa";
import { FiSend, FiMessageSquare, FiTrash2 } from "react-icons/fi";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/components/common/ToastProvider";
import { adminDeleteChatConversation, adminDeleteChatMessage } from "@/lib/apiClient";
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

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
};

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
  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState | null>(null);
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const selectedConversationRef = React.useRef<string | null>(null);
  const toast = useToast();

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

  React.useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  React.useEffect(() => {
    if (!socket || !selectedConversation) return;

    socket.emit("admin:join-conversation", selectedConversation);
    return () => {
      socket.emit("admin:leave-conversation", selectedConversation);
    };
  }, [socket, selectedConversation]);

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
        const isActiveConversation = selectedConversationRef.current === data.message.sessionId;
        if (isActiveConversation) {
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
        
        // Tăng unread count nếu tin nhắn từ user
        if (data.message.role === 'user') {
          if (!isActiveConversation) {
            console.log("Admin chat page: Incrementing unread count");
            setUnreadCount(prev => prev + 1);
            
            // Cập nhật conversations để tăng unread count cho conversation này
            setConversations(prev => prev.map(conv => 
              conv._id === data.message.sessionId 
                ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
                : conv
            ));
          }
          
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
        if (selectedConversationRef.current === data.message.sessionId) {
          setMessages(prev => {
            // Kiểm tra xem tin nhắn đã tồn tại chưa
            const exists = prev.some(msg => msg._id === newMessage._id);
            if (exists) {
              console.log("Message already exists, skipping:", newMessage._id);
              return prev;
            }
            return [...prev, newMessage];
          });
        } else {
          loadConversations();
        }
      }
    };

    const handleConversationUpdate = (data: any) => {
      // Reload conversations when there's an update
      loadConversations();
    };

    // Join admin room để nhận tin nhắn từ tất cả conversations
    socket.emit("admin:join-conversation", "admin");

    socket.on("admin-chat:new-message", handleNewMessage);
    socket.on("admin-chat:admin-message", handleAdminMessage);
    socket.on("admin-chat:conversation-updated", handleConversationUpdate);

    return () => {
      console.log("Admin chat page: Cleaning up socket listeners");
      socket.off("admin-chat:new-message", handleNewMessage);
      socket.off("admin-chat:admin-message", handleAdminMessage);
      socket.off("admin-chat:conversation-updated", handleConversationUpdate);
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

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
      if (confirmDialog.successMessage) {
        toast.success(confirmDialog.successMessage);
      }
      setConfirmDialog(null);
    } catch (error) {
      const fallbackMessage =
        confirmDialog.errorMessage ||
        (error instanceof Error && error.message) ||
        "Đã xảy ra lỗi";
      toast.error(fallbackMessage);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDeleteConversation = (sessionId: string) => {
    const conv = conversations.find((c) => c._id === sessionId);
    setConfirmDialog({
      title: "Xóa cuộc trò chuyện",
      description: `Bạn có chắc muốn xóa toàn bộ tin nhắn của ${conv?.user?.name || conv?.user?.email || "người dùng"}? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa cuộc trò chuyện",
      cancelText: "Hủy",
      successMessage: "Đã xóa cuộc trò chuyện thành công",
      errorMessage: "Lỗi khi xóa cuộc trò chuyện",
      onConfirm: async () => {
        await adminDeleteChatConversation(sessionId);
        setMessages([]);
        setSelectedConversation(null);
        await loadConversations();
        setUnreadCount((prev) => {
          const convToDelete = conversations.find((c) => c._id === sessionId);
          if (!convToDelete) return prev;
          return Math.max(0, prev - (convToDelete.unreadCount || 0));
        });
      },
    });
  };

  const handleDeleteMessage = (msg: Message) => {
    setConfirmDialog({
      title: "Xóa tin nhắn",
      description: "Bạn có chắc muốn xóa tin nhắn này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa tin nhắn",
      cancelText: "Hủy",
      successMessage: "Đã xóa tin nhắn thành công",
      errorMessage: "Lỗi khi xóa tin nhắn",
      onConfirm: async () => {
        await adminDeleteChatMessage(msg._id);
        await loadMessages(msg.sessionId);
        await loadConversations();
      },
    });
  };

  if (loadingMe) return <div className="p-6">Đang kiểm tra quyền…</div>;
  if (!me || me.role !== 'admin') return <div className="p-6 text-red-600">Chỉ dành cho Admin</div>;

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex flex-col overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col p-6 gap-6">
          <header className="bg-white rounded-xl shadow-lg p-6 border border-zinc-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl p-3 shadow-lg">
                  <FaUserTie className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                    Quản lý Chat với Admin
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse shadow-md">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-zinc-600 mt-1">
                    Trả lời tin nhắn từ người dùng
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Conversations List */}
            <div className="bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white flex-shrink-0">
                <h2 className="font-bold text-lg text-zinc-900">Cuộc trò chuyện</h2>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500">
                    <FiMessageSquare className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                    <p className="font-medium">Chưa có cuộc trò chuyện nào</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv._id)}
                      className={`p-4 border-b border-zinc-100 cursor-pointer transition-all ${
                        selectedConversation === conv._id 
                          ? "bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-l-teal-500" 
                          : "hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 truncate">
                            {conv.user?.name || 'User'}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-1">
                            {conv.user?.email || conv.userId}
                          </p>
                          <p className="text-xs text-zinc-600 truncate mt-2 line-clamp-1">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {new Date(conv.lastMessageAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-1 shadow-md">
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
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-zinc-200 flex flex-col overflow-hidden h-full">
              {selectedConversation ? (
                <>
                  <div className="p-5 border-b border-zinc-200 bg-gradient-to-r from-teal-50 to-blue-50 flex-shrink-0 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900">
                        Cuộc trò chuyện với {conversations.find(c => c._id === selectedConversation)?.user?.name || 'User'}
                      </h3>
                      <p className="text-sm text-zinc-600 mt-1">
                        {conversations.find(c => c._id === selectedConversation)?.user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteConversation(selectedConversation)}
                      className="self-start md:self-auto px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Xóa cuộc trò chuyện
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-zinc-50 to-white min-h-0">
                    {loading ? (
                      <div className="text-center text-zinc-500 py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="font-medium">Đang tải tin nhắn...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-zinc-500 py-12">
                        <FiMessageSquare className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                        <p className="font-medium text-lg">Chưa có tin nhắn nào</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isAdminMessage = msg.role === "admin";
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-xl px-4 py-3 shadow-md ${
                                isAdminMessage
                                  ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white"
                                  : "bg-white border border-zinc-200 text-zinc-900"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  {isAdminMessage ? (
                                    <FaUserTie className="h-4 w-4" />
                                  ) : (
                                    <FiMessageSquare className="h-4 w-4" />
                                  )}
                                  <span className="text-xs font-semibold">
                                    {isAdminMessage ? "Admin" : "User"}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(msg);
                                  }}
                                  aria-label="Xóa tin nhắn"
                                  className={`p-1.5 rounded-md transition-colors ${
                                    isAdminMessage
                                      ? "text-white/80 hover:bg-white/20"
                                      : "text-zinc-500 hover:bg-zinc-100"
                                  }`}
                                >
                                  <FiTrash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              <p className={`text-xs mt-2 ${isAdminMessage ? "opacity-80" : "text-zinc-500"}`}>
                                {new Date(msg.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-5 border-t border-zinc-200 bg-white flex-shrink-0">
                    <div className="flex gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn trả lời..."
                        rows={2}
                        className="flex-1 resize-none rounded-lg border border-zinc-300 bg-white text-zinc-900 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-lg hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2 font-medium"
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
                <div className="flex-1 flex items-center justify-center text-zinc-500 overflow-hidden">
                  <div className="text-center px-6">
                    <FiMessageSquare className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">Chọn một cuộc trò chuyện để xem tin nhắn</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={() => {
            if (!confirmLoading) {
              setConfirmDialog(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-6"
            style={{ animation: "slideUp 0.3s ease-out" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">{confirmDialog.title}</h3>
                <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{confirmDialog.description}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (!confirmLoading) {
                    setConfirmDialog(null);
                  }
                }}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirmDialog.cancelText ?? "Hủy"}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={confirmLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-md font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirmLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="h-4 w-4" />
                    {confirmDialog.confirmText ?? "Xác nhận"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
