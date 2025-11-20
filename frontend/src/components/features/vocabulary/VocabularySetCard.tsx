// frontend/src/components/features/vocabulary/VocabularySetCard.tsx
"use client";

import { VocabularySet } from "@/types/vocabulary.types";
import {
  ArrowRight,
  BookMarked,
  Copy,
  Flame,
  LucideIcon,
  MoreHorizontal,
  PlayCircle,
  RefreshCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface VocabularySetProgress {
  masteredCount: number;
  difficultCount: number;
  percent: number;
  lastStudied: string | null;
  sessions: number;
}

interface VocabularySetCardProps {
  set: VocabularySet;
  progress: VocabularySetProgress;
  highlight?: boolean;
  onOpen: (set: VocabularySet) => void;
  onStudy: (set: VocabularySet) => void;
  onQuickQuiz: (set: VocabularySet) => void;
  onEdit: (set: VocabularySet) => void;
  onDuplicate: (set: VocabularySet) => void;
  onDelete: (set: VocabularySet) => void;
}

export function VocabularySetCard({
  set,
  progress,
  highlight = false,
  onOpen,
  onStudy,
  onQuickQuiz,
  onEdit,
  onDuplicate,
  onDelete,
}: VocabularySetCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleAction = (action: () => void) => {
    setMenuOpen(false);
    // Use setTimeout to ensure menu closes before action is called
    setTimeout(() => {
      action();
    }, 0);
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-3xl border bg-white/95 p-5 shadow-sm transition duration-200",
        "dark:border-zinc-800/80 dark:bg-zinc-900/90",
        highlight
          ? "border-sky-200/80 shadow-sky-100/60 dark:border-sky-800/60"
          : "border-zinc-200/80 hover:border-sky-200/80 hover:shadow-lg"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            <span>Bộ từ vựng</span>
            {set.topic && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal",
                  topicBadge(set.topic)
                )}
              >
                {set.topic}
              </span>
            )}
          </div>
          <button
            onClick={() => onOpen(set)}
            className="text-left text-xl font-semibold text-zinc-900 outline-none transition hover:text-sky-600 focus-visible:text-sky-600 dark:text-zinc-50"
          >
            <span className="line-clamp-2">{set.title}</span>
          </button>
          {set.description && (
            <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {set.description}
            </p>
          )}
        </div>

        <div className="relative">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-200/70 text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white"
            aria-label="Xem thêm hành động"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-zinc-200/80 bg-white/95 p-2 text-sm shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-900/95"
            >
              <ActionItem
                icon={BookMarked}
                label="Xem chi tiết"
                onClick={() => handleAction(() => onOpen(set))}
              />
              <ActionItem
                icon={Copy}
                label="Nhân bản"
                onClick={() => handleAction(() => onDuplicate(set))}
              />
              <ActionItem
                icon={RefreshCcw}
                label="Chỉnh sửa"
                onClick={() => handleAction(() => onEdit(set))}
              />
              <ActionItem
                icon={Trash2}
                label="Xóa bộ từ"
                tone="danger"
                onClick={() => handleAction(() => onDelete(set))}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/80 p-4 text-sm dark:border-zinc-800/70 dark:from-zinc-900 dark:via-zinc-900 dark:to-sky-950/40">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span>Tiến độ</span>
          <span>{progress.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            {progress.masteredCount} đã thuộc
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Flame className="h-3.5 w-3.5" />
            {progress.difficultCount} cần ôn
          </span>
          <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
            {set.terms.length} từ
          </span>
          {progress.sessions > 0 && (
            <span className="text-zinc-500">{progress.sessions} phiên học</span>
          )}
        </div>
      </div>

      <div className="mt-auto grid grid-cols-1 gap-2 pt-5 sm:grid-cols-2">
        <button
          onClick={() => onStudy(set)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <PlayCircle className="h-4 w-4" />
          Luyện flashcard
        </button>
        <button
          onClick={() => onQuickQuiz(set)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200/80 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-sky-200 hover:text-sky-600 dark:border-zinc-700 dark:text-zinc-200"
        >
          Quiz nhanh
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function topicBadge(topic?: string) {
  if (!topic)
    return "bg-zinc-950/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-300";
  const palettes = [
    "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
    "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
  ];
  const index =
    topic
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

function ActionItem({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
        tone === "danger"
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
