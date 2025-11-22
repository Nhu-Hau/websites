"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { FaUserTie, FaGraduationCap } from "react-icons/fa";
import { useChat } from "@/context/ChatContext";
import useClickOutside from "@/hooks/common/useClickOutside";
import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AdminChatContent from "./chat/AdminChatContent";
import AIChatContent from "./chat/AIChatContent";
import { useIsMobile } from "@/hooks/common/useIsMobile";

export default function ChatPanel() {
  const { open, setOpen, activeTab, setActiveTab } = useChat();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const isMobileViewport =
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767.98px)").matches
      : isMobile;

  useClickOutside(wrapperRef, () => setOpen(false), {
    enabled: open && !isMobileViewport,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={wrapperRef}
          key="chat-panel"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="hidden md:block fixed lg:bottom-24 md:bottom-36 right-6 z-[9999] w-full max-w-md pointer-events-auto [body[data-cropping]>&]:hidden"
        >
          {/* Khung panel: chiều cao cố định + giới hạn theo viewport */}
          <div className="flex flex-col h-[460px] max-h-[calc(100vh-7rem)] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            {/* Header + Tabs */}
            <div className="relative flex-shrink-0 border-b border-gray-200 dark:border-zinc-700 rounded-b-2xl">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "admin"
                      ? "bg-gradient-to-r from-orange-50/80 to-amber-50/60 dark:from-orange-900/30 dark:to-amber-900/20 text-orange-700 dark:text-orange-300 border-b-2 border-orange-500 rounded-b-2xl"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <FaUserTie className="h-4 w-4" />
                  <span>Chat với admin</span>
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "ai"
                      ? "bg-gradient-to-r from-sky-50/80 to-indigo-50/60 dark:from-sky-900/30 dark:to-indigo-900/20 text-sky-700 dark:text-sky-300 border-b-2 border-sky-500 rounded-b-2xl"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <FaGraduationCap className="h-4 w-4" />
                  <span>Chat AI TOEIC</span>
                </button>
              </div>

              {/* Close button */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                  aria-label="Đóng chat"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content: luôn fill phần còn lại, nhiều tin thì scroll */}
            <div className="flex-1 min-h-0 flex flex-col">
              <AnimatePresence mode="wait">
                {activeTab === "admin" ? (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-h-0 overflow-y-auto"
                  >
                    <AdminChatContent isMobile={false} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-h-0 overflow-y-auto"
                  >
                    <AIChatContent isMobile={false} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
