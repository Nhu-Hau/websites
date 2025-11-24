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
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

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
  onDelete?: (set: VocabularySet) => void;
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
  const t = useTranslations("vocabularyComponents.card");
  const router = useRouter();
  const basePrefix = useBasePrefix();
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
      ? t("status.notStarted")
      : percent < 40
      ? t("status.learning")
      : percent < 80
      ? t("status.goodProgress")
      : t("status.nearComplete");

  const handleCardOpen = React.useCallback(() => {
    onOpen(set);
  }, [onOpen, set]);

  const stopPropagation = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
  };

  return (
    // Wrapper để có perspective 3D cho hiệu ứng "lật"
    <div className="h-full" style={{ perspective: 1100 }}>
      <motion.article
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover={{ y: -4, rotateX: 4, rotateY: -2 }}
        whileTap={{ scale: 0.985, rotateX: 0, rotateY: 0 }}
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
          "group relative flex h-full min-h-[240px] cursor-pointer flex-col overflow-hidden rounded-xl border border-white/80 bg-white/95 p-2.5 text-slate-900 shadow-md shadow-slate-900/5 transition",
          "xs:rounded-2xl xs:p-3",
          "backdrop-blur-xl hover:shadow-lg hover:shadow-[#1f2a420f]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4063bb]",
          "dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:text-zinc-50 dark:hover:shadow-black/40",
          highlight ? "ring-1 ring-[#4063bb33] dark:ring-[#4063bb4d]" : ""
        )}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4063bb] via-sky-400 to-emerald-300 opacity-80" />
        <div className="pointer-events-none absolute -right-10 top-4 h-20 w-20 rounded-full bg-[#4063bb1a] blur-3xl dark:bg-[#4063bb33]" />

        {/* Shine effect khi hover – cảm giác như đang lật / quét sáng */}
        <div className="pointer-events-none absolute inset-0 -left-1/3 translate-x-[-40%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition duration-500 group-hover:translate-x-[130%] group-hover:opacity-100 dark:via-white/10" />

        {/* Kebab menu – absolute góc phải, không chiếm layout */}
        <div className="absolute right-2 top-1.5 xs:right-3 xs:top-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/70 bg-white/90 text-slate-500 shadow-sm shadow-slate-900/5 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 xs:h-7 xs:w-7 xs:rounded-xl"
              aria-label={t("actions.moreActions")}
              onClick={(event) => {
                stopPropagation(event);
                setMenuOpen((prev) => !prev);
              }}
            >
              <MoreHorizontal className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-slate-100/80 bg-white/95 p-1 text-xs shadow-2xl shadow-slate-900/10 dark:border-zinc-700 dark:bg-zinc-900 xs:w-40 xs:rounded-2xl xs:p-1.5 xs:text-sm">
                <ActionItem
                  icon={BookMarked}
                  label={t("actions.viewDetail")}
                  onClick={(event) => {
                    stopPropagation(event as any);
                    handleAction(() => onOpen(set));
                  }}
                />
                <ActionItem
                  icon={Copy}
                  label={t("actions.duplicate")}
                  onClick={(event) => {
                    stopPropagation(event as any);
                    handleAction(() => onDuplicate(set));
                  }}
                />
                <ActionItem
                  icon={RefreshCcw}
                  label={t("actions.edit")}
                  onClick={(event) => {
                    stopPropagation(event as any);
                    handleAction(() => onEdit(set));
                  }}
                />
                <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                <ActionItem
                  icon={Trash2}
                  label={t("actions.delete")}
                  tone="danger"
                  onClick={(event) => {
                    stopPropagation(event as any);
                    handleAction(() => onDelete?.(set));
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start gap-2 pr-8 xs:gap-2.5 xs:pr-9">
          {/* Avatar */}
          <button
            type="button"
            onClick={(event) => {
              stopPropagation(event);
              onOpen(set);
            }}
            className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#4063bb] text-white shadow-sm shadow-[#4063bb33] xs:h-8 xs:w-8 xs:rounded-2xl"
          >
            <div className="absolute inset-0 rounded-xl bg-white/25 blur-md xs:rounded-2xl" />
            <BookMarked className="relative z-10 h-3 w-3 xs:h-3.5 xs:w-3.5" />
          </button>

          <div className="min-w-0 flex-1 space-y-0.5 xs:space-y-1">
            {/* Meta */}
            <div className="flex flex-wrap flex-col items-start justify-center gap-1 text-[9px] font-medium text-slate-500 xs:text-[10px]">
              <span className="uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
                {t("badge")}
              </span>
              {set.topic && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold xs:px-2 xs:text-[10px]",
                    topicBadge(set.topic)
                  )}
                >
                  #{set.topic}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-1.5 flex flex-1 flex-col gap-1.5 xs:mt-2 xs:gap-2">
          {/* Title */}
          <button
            type="button"
            onClick={(event) => {
              stopPropagation(event);
              onOpen(set);
            }}
            className="block w-full text-left text-[12px] font-semibold leading-snug text-slate-900 transition hover:text-[#4063bb] focus:outline-none xs:text-[13px] dark:text-zinc-50 dark:hover:text-sky-300"
          >
            <span className="block w-full break-words line-clamp-2">
              {set.title}
            </span>
          </button>

          {/* Description – từ xs trở lên */}
          {set.description && (
            <p className="hidden xs:block text-[11px] leading-snug text-slate-600 dark:text-zinc-400 line-clamp-2">
              {set.description}
            </p>
          )}

          {/* Terms info */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 xs:text-[11px]">
            <span className="font-medium">{set.terms.length} {t("terms")}</span>
            {progress.sessions > 0 && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                <span>{progress.sessions} {t("sessions")}</span>
              </>
            )}
            {progress.lastStudied && (
              <>
                <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                <span className="truncate max-w-[80px] xs:max-w-none">
                  {progress.lastStudied}
                </span>
              </>
            )}
          </div>

          {/* Trạng thái */}
          {!hasTerms ? (
            <div className="mt-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-2.5 py-2 text-center text-[10px] text-slate-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 xs:rounded-2xl xs:px-3 xs:py-2.5 xs:text-[11px]">
              <p className="hidden text-[10px] font-semibold text-slate-800 dark:text-zinc-50 sm:block">
                Chưa có từ nào trong bộ này
              </p>
              <p className="mt-0.5 text-[9px] text-slate-500 dark:text-zinc-400 xs:text-[10px]">
                Nhấn mở bộ từ để thêm từ vựng đầu tiên.
              </p>
            </div>
          ) : hasStudy ? (
            <>
              {/* Mobile: progress đơn giản */}
              <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-[10px] text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200 xs:hidden">
                <div className="inline-flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#4063bb]" />
                  <span>Tiến độ: {percent}%</span>
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-wide">
                  {statusLabel}
                </span>
              </div>

              {/* xs+: progress chi tiết */}
              <div className="mt-1 hidden rounded-2xl border border-slate-100/80 bg-slate-50/60 p-2 shadow-inner dark:border-zinc-800 dark:bg-zinc-900/60 xs:block xs:p-2.5">
                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 dark:text-zinc-300 xs:text-[10px]">
                  <div className="inline-flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-[#4063bb] xs:h-3 xs:w-3" />
                    <span>Tiến độ học</span>
                  </div>
                  <span className="tabular-nums">{percent}%</span>
                </div>

                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/70 dark:bg-zinc-800 xs:mt-1.5 xs:h-1.5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#4063bb] via-sky-400 to-emerald-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 18 }}
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[9px] text-slate-600 dark:text-zinc-300 xs:mt-2 xs:gap-1.5 xs:text-[10px]">
                  <div className="inline-flex flex-wrap items-center gap-1">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-white/80 px-1 py-0.5 text-[9px] font-semibold text-emerald-600 dark:bg-zinc-800/80 dark:text-emerald-300 xs:px-1.5 xs:text-[10px]">
                      <Sparkles className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
                      <span className="tabular-nums">
                        {progress.masteredCount}
                      </span>
                      <span>đã thuộc</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-white/80 px-1 py-0.5 text-[9px] font-semibold text-amber-600 dark:bg-zinc-800/80 dark:text-amber-300 xs:px-1.5 xs:text-[10px]">
                      <Flame className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
                      <span className="tabular-nums">
                        {progress.difficultCount}
                      </span>
                      <span>cần ôn</span>
                    </span>
                  </div>

                  <span className="rounded-full bg-slate-900/5 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-slate-700 dark:bg-white/10 dark:text-white/80 xs:px-2 xs:text-[9px]">
                    {statusLabel}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-1 rounded-2xl border border-slate-100 bg-white/80 px-2.5 py-1.5 text-[10px] text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 xs:px-3 xs:py-2 xs:text-[11px]">
              <p className="font-semibold text-slate-800 dark:text-zinc-50">
                Đã có {set.terms.length} từ trong bộ này
              </p>
              <p className="mt-0.5 text-[9px] text-slate-500 dark:text-zinc-400 xs:text-[10px]">
                Bấm &quot;Học flashcard&quot; để bắt đầu theo dõi tiến độ học.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions – mobile-first */}
        <div className="mt-2 flex flex-col gap-1 xs:mt-2.5 xs:flex-row xs:items-center xs:gap-1.5">
          <button
            type="button"
            onClick={(event) => {
              stopPropagation(event);
              if (!hasTerms) {
                toast.info(
                  "Bộ từ này chưa có từ nào. Hãy thêm từ vựng để bắt đầu học!"
                );
                router.push(`${basePrefix}/vocabulary/${set._id}`);
              } else {
                onStudy(set);
              }
            }}
            className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-2.5 text-[11px] font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 xs:h-8 xs:flex-1 xs:px-3 xs:text-[12px]"
          >
            <PlayCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
            <span>Flashcard</span>
          </button>

          <button
            type="button"
            onClick={(event) => {
              stopPropagation(event);
              if (!hasTerms) {
                toast.info(
                  "Bộ từ này chưa có từ nào. Hãy thêm từ vựng để bắt đầu học!"
                );
                router.push(`${basePrefix}/vocabulary/${set._id}`);
              } else {
                onQuickQuiz(set);
              }
            }}
            className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-2xl border border-slate-200/80 bg-white/80 px-2.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-[#4063bb66] hover:text-[#4063bb] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 xs:h-8 xs:w-auto xs:flex-none xs:px-3 xs:text-[12px]"
          >
            <ArrowRight className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
            <span>Quiz</span>
          </button>
        </div>
      </motion.article>
    </div>
  );
}

function topicBadge(topic?: string) {
  if (!topic) {
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  }

  const palettes = [
    "bg-sky-50 text-[#4063bb] dark:bg-sky-900/30 dark:text-sky-200",
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
        "flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[11px] transition xs:rounded-xl xs:gap-2 xs:px-2.5 xs:py-1.5 xs:text-[12px]",
        tone === "danger"
          ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
          : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      <Icon className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
      <span>{label}</span>
    </button>
  );
}