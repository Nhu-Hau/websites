"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare } from "react-icons/fi";
import { useChat } from "@/context/ChatContext";
import { useEffect, useState } from "react";

export default function ChatFAB() {
  const { open, setOpen, unreadCount, setActiveTab } = useChat();
  const [isCropping, setIsCropping] = useState(false);

  const totalUnread = unreadCount.admin + unreadCount.ai;

  // Check if image cropper is open
  useEffect(() => {
    const checkCropping = () => {
      setIsCropping(document.body.hasAttribute("data-cropping"));
    };

    // Check initially
    checkCropping();

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(checkCropping);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-cropping"],
    });

    return () => observer.disconnect();
  }, []);

  if (isCropping) return null;

  return (
    <div className="fixed z-[110] right-4 bottom-20 lg:right-6 lg:bottom-6">
      <motion.button
        onClick={() => {
          setActiveTab("ai");
          setOpen((prev) => !prev);
        }}
        aria-label={open ? "Đóng chat" : "Mở chat"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full
                   bg-gradient-to-tr from-sky-500 to-indigo-600 text-white
                   shadow-xl shadow-sky-500/40 ring-4 ring-white/30
                   hover:scale-110 active:scale-95 transition-all duration-200
                   focus:outline-none focus:ring-4 focus:ring-sky-400/50
                   dark:from-sky-600 dark:to-indigo-600"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <FiMessageSquare className="h-6 w-6" />
        </motion.div>

        <AnimatePresence>
          {totalUnread > 0 && !open && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center
                         rounded-full bg-red-500 text-white text-xs font-bold shadow-lg animate-pulse"
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}