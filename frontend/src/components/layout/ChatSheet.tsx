"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { FaUserTie, FaGraduationCap } from "react-icons/fa";
import { useChat } from "@/context/ChatContext";
import AdminChatContent from "./chat/AdminChatContent";
import AIChatContent from "./chat/AIChatContent";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ChatSheet() {
  const { open, setOpen, activeTab, setActiveTab } = useChat();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] md:hidden bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom sheet với chiều cao cố định */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[10000] md:hidden",
              "w-full bg-white dark:bg-zinc-900",
              "rounded-t-3xl shadow-2xl",
              "flex flex-col",
              "h-[620px] max-h-[calc(100vh-4rem)]" // 👈 cố định chiều cao
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Tabs */}
            <div className="relative flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("admin")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === "admin"
                      ? "bg-gradient-to-r from-orange-50/80 to-amber-50/60 dark:from-orange-900/30 dark:to-amber-900/20 text-orange-700 dark:text-orange-300 border-b-2 border-orange-500 rounded-tl-3xl"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  )}
                >
                  <FaUserTie className="h-4 w-4" />
                  <span className="hidden xs:inline">Chat với admin</span>
                  <span className="xs:hidden">Admin</span>
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === "ai"
                      ? "bg-gradient-to-r from-sky-50/80 to-indigo-50/60 dark:from-sky-900/30 dark:to-indigo-900/20 text-sky-700 dark:text-sky-300 border-b-2 border-sky-500 rounded-tr-3xl"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  )}
                >
                  <FaGraduationCap className="h-4 w-4" />
                  <span className="hidden xs:inline">Chat AI TOEIC</span>
                  <span className="xs:hidden">AI</span>
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

            {/* Content Area – luôn fill phần còn lại, tin nhắn nhiều thì scroll */}
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
                    <AdminChatContent isMobile={true} />
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
                    <AIChatContent isMobile={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
