"use client";

import React from "react";
import { Smile } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const EMOJIS = ["❤️", "👍", "😂", "😲", "😢", "😡"] as const;

interface ReactionPickerProps {
  postId: string;
  currentReaction?: string | null;
  onReactionChange?: () => void;
}

export default function ReactionPicker({
  postId,
  currentReaction,
  onReactionChange,
}: ReactionPickerProps) {
  const t = useTranslations("community.reactions");
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [reacting, setReacting] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleReaction = async (emoji: string) => {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }

    if (reacting) return;

    setReacting(true);
    try {
      if (currentReaction === emoji) {
        // Remove reaction
        await fetch(`${API_BASE}/api/community/posts/${postId}/reaction`, {
          method: "DELETE",
          credentials: "include",
        });
      } else {
        // Add/update reaction
        await fetch(`${API_BASE}/api/community/posts/${postId}/reaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ emoji }),
        });
      }
      setOpen(false);
      onReactionChange?.();
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setReacting(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        disabled={reacting}
      >
        <Smile className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        {currentReaction && (
          <span className="text-sm">{currentReaction}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex gap-2 z-10">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={`
                text-2xl p-2 rounded-lg transition-all
                hover:scale-125 hover:bg-zinc-100 dark:hover:bg-zinc-800
                ${currentReaction === emoji ? "bg-blue-50 dark:bg-blue-900/30" : ""}
              `}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


