/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { motion } from "framer-motion";

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

/* =============== CARD MOTION =============== */
const cardVariants = {
  initial: { opacity: 0, y: -6, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 110,
      damping: 18,
      mass: 0.8,
    },
  },
};

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
    setTimeout(action, 0);
  };

  const percent = Math.max(0, Math.min(progress.percent, 100));
  const hasStudy = progress.sessions > 0 || percent > 0;
  const hasTerms = set.terms && set.terms.length > 0;

  const statusLabel =
    percent === 0
      ? "Chưa bắt đầu"
      : percent < 40
      ? "Đang làm quen"
      : percent < 80
      ? "Tiến độ tốt"
      : "Gần hoàn thành";

  const handleCardOpen = React.useCallback(() => {
    onOpen(set);
  }, [onOpen, set]);

  const stopPropagation = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.985, y: 0 }}
      onClick={handleCardOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardOpen();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-3 text-slate-900 shadow-md shadow-slate-900/5 transition",
        "xs:p-3.5 sm:p-4",
        "backdrop-blur-xl hover:-translate-y-1 hover:shadow-lg hover:shadow-[#1f2a420f]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5EB8]",
        "dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:text-zinc-50 dark:hover:shadow-black/40",
        highlight ? "ring-1 ring-[#2E5EB833] dark:ring-[#2E5EB84d]" : ""
      )}
    >
      {/* accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2E5EB8] via-sky-400 to-emerald-300 opacity-80" />
      <div className="pointer-events-none absolute -right-10 top-4 h-20 w-20 rounded-full bg-[#2E5EB81a] blur-3xl dark:bg-[#2E5EB833]" />

      {/* Kebab menu – absolute góc phải, không chiếm layout */}
      <div className="absolute right-3 top-2">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/80 text-slate-500 shadow-sm shadow-slate-900/5 transition hover:bg-slate-100 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700"
            aria-label="Xem thêm hành động"
            onClick={(event) => {
              stopPropagation(event);
              setMenuOpen((prev) => !prev);
            }}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1.5 w-40 rounded-2xl border border-slate-100 bg-white/95 p-1.5 text-sm shadow-2xl shadow-slate-900/10 dark:border-zinc-700 dark:bg-zinc-900">
              <ActionItem
                icon={BookMarked}
                label="Xem chi tiết"
                onClick={(event) => {
                  stopPropagation(event as any);
                  handleAction(() => onOpen(set));
                }}
              />
              <ActionItem
                icon={Copy}
                label="Nhân bản"
                onClick={(event) => {
                  stopPropagation(event as any);
                  handleAction(() => onDuplicate(set));
                }}
              />
              <ActionItem
                icon={RefreshCcw}
                label="Chỉnh sửa"
                onClick={(event) => {
                  stopPropagation(event as any);
                  handleAction(() => onEdit(set));
                }}
              />
              <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
              <ActionItem
                icon={Trash2}
                label="Xóa bộ từ"
                tone="danger"
                onClick={(event) => {
                  stopPropagation(event as any);
                  handleAction(() => onDelete(set));
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-9">
        {/* Avatar – nhỏ cho mobile */}
        <button
          type="button"
          onClick={(event) => {
            stopPropagation(event);
            onOpen(set);
          }}
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#2E5EB8] text-white shadow-sm shadow-[#2E5EB833] xs:h-9 xs:w-9"
        >
          <div className="absolute inset-0 rounded-2xl bg-white/25 blur-md" />
          <BookMarked className="relative z-10 h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <span className="uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
              Bộ từ vựng
            </span>
            {set.topic && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  topicBadge(set.topic)
                )}
              >
                #{set.topic}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body: description + terms info full width + trạng thái */}
      <div className="mt-2 flex flex-1 flex-col gap-2">
        {/* Title – chiếm full width, tràn thì “...” sau 2 dòng */}
        <button
          type="button"
          onClick={(event) => {
            stopPropagation(event);
            onOpen(set);
          }}
          className="block w-full text-left text-[13px] font-semibold leading-snug text-slate-900 transition hover:text-[#2E5EB8] focus:outline-none xs:text-[14px] dark:text-zinc-50 dark:hover:text-sky-300"
        >
          <span className="block w-full break-words line-clamp-2">
            {set.title}
          </span>
        </button>
        {/* Description – ẩn trên mobile, chỉ hiện từ xs trở lên */}
        {set.description && (
          <p className="hidden xs:block text-[12px] leading-snug text-slate-600 dark:text-zinc-400 line-clamp-2">
            {set.description}
          </p>
        )}

        {/* Terms info full width */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
          <span className="font-medium">{set.terms.length} từ</span>
          {progress.sessions > 0 && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{progress.sessions} phiên học</span>
            </>
          )}
          {progress.lastStudied && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Lần cuối: {progress.lastStudied}</span>
            </>
          )}
        </div>

        {/* Trạng thái theo số lượng từ */}
        {!hasTerms ? (
          <div className="mt-1 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2.5 text-center text-[11px] text-slate-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            <p className="font-semibold text-slate-800 dark:text-zinc-50 sm:block hidden">
              Chưa có từ nào trong bộ này
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
              Nhấn mở bộ từ để thêm từ vựng đầu tiên.
            </p>
          </div>
        ) : hasStudy ? (
          <>
            {/* Mobile: chỉ hiển thị progress đơn giản */}
            <div className="mt-1 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 xs:hidden">
              <div className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#2E5EB8]" />
                <span>Tiến độ: {percent}%</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {statusLabel}
              </span>
            </div>

            {/* Từ xs trở lên: hiển thị full progress bar + chips */}
            <div className="mt-1 hidden rounded-2xl border border-slate-100/80 bg-slate-50/60 p-2.5 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/60 xs:block">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-zinc-300">
                <div className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#2E5EB8]" />
                  <span>Tiến độ học</span>
                </div>
                <span className="tabular-nums">{percent}%</span>
              </div>

              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/70 dark:bg-zinc-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#2E5EB8] via-sky-400 to-emerald-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: "spring", stiffness: 90, damping: 18 }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-600 dark:text-zinc-300">
                <div className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-zinc-800/80 dark:text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    <span className="tabular-nums">
                      {progress.masteredCount}
                    </span>
                    <span>đã thuộc</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-zinc-800/80 dark:text-amber-300">
                    <Flame className="h-3 w-3" />
                    <span className="tabular-nums">
                      {progress.difficultCount}
                    </span>
                    <span>cần ôn</span>
                  </span>
                </div>

                <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[9px] uppercase tracking-widest text-slate-700 dark:bg-white/10 dark:text-white/80">
                  {statusLabel}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-1 rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-[11px] text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            <p className="font-semibold text-slate-800 dark:text-zinc-50">
              Đã có {set.terms.length} từ trong bộ này
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
              Bấm “Học flashcard” để bắt đầu theo dõi tiến độ học.
            </p>
          </div>
        )}
      </div>

      {/* Footer actions – mobile-first, nút nhỏ lại */}
      <div className="mt-3 flex flex-col gap-1.5 xs:flex-row xs:items-center xs:gap-2">
        <button
          type="button"
          onClick={(event) => {
            stopPropagation(event);
            onStudy(set);
          }}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-[#2E5EB8] px-3 text-[12px] font-semibold text-white shadow-sm shadow-[#2E5EB833] transition hover:brightness-110 xs:h-9 xs:flex-1 xs:text-[13px]"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          <span>Flashcard</span>
        </button>

        <button
          type="button"
          onClick={(event) => {
            stopPropagation(event);
            onQuickQuiz(set);
          }}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 transition hover:border-[#2E5EB8] hover:text-[#2E5EB8] dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 xs:h-9 xs:w-auto xs:flex-none xs:text-[13px]"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Quiz</span>
        </button>
      </div>
    </motion.article>
  );
}

function topicBadge(topic?: string) {
  if (!topic) {
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  }

  const palettes = [
    "bg-sky-50 text-[#2E5EB8] dark:bg-sky-900/30 dark:text-sky-200",
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200",
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200",
  ];

  const index =
    topic.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    palettes.length;

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
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[12px] transition",
        tone === "danger"
          ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
