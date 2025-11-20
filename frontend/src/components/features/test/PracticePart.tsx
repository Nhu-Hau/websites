/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import LevelSwitcher from "@/components/features/test/LevelSwitcher";
import TestCard, {
  AttemptSummary,
  TestCardSkeleton,
} from "@/components/features/test/TestCard";
import {
  History,
  Headphones,
  BookOpen,
  ChevronRight,
  Star,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import LevelSuggestModal from "@/components/features/test/LevelSuggestModal";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Variants } from "framer-motion";

/* ====== META ====== */
const PART_META: Record<
  string,
  { title: string; defaultQuestions: number; defaultDuration: number }
> = {
  "part.1": {
    title: "Part 1 – Photographs",
    defaultQuestions: 6,
    defaultDuration: 6,
  },
  "part.2": {
    title: "Part 2 – Question–Response",
    defaultQuestions: 25,
    defaultDuration: 11,
  },
  "part.3": {
    title: "Part 3 – Conversations",
    defaultQuestions: 39,
    defaultDuration: 20,
  },
  "part.4": {
    title: "Part 4 – Talks",
    defaultQuestions: 30,
    defaultDuration: 13,
  },
  "part.5": {
    title: "Part 5 – Incomplete Sentences",
    defaultQuestions: 30,
    defaultDuration: 17,
  },
  "part.6": {
    title: "Part 6 – Text Completion",
    defaultQuestions: 16,
    defaultDuration: 12,
  },
  "part.7": {
    title: "Part 7 – Reading Comprehension",
    defaultQuestions: 54,
    defaultDuration: 55,
  },
};

type L = 1 | 2 | 3;
type AttemptMap = Record<number, AttemptSummary>;

const levelConfig: Record<
  L,
  {
    label: string;
    desc: string;
    textColor: string;
    bgColor: string;
  }
> = {
  1: {
    label: "Level 1",
    desc: "Beginner",
    textColor: "text-[#347433] dark:text-[#4C9C43]",
    bgColor: "bg-[#4C9C43]/10 dark:bg-[#4C9C43]/20",
  },
  2: {
    label: "Level 2",
    desc: "Intermediate",
    textColor: "text-[#27548A] dark:text-[#2E5EB8]",
    bgColor: "bg-[#2E5EB8]/10 dark:bg-[#2E5EB8]/20",
  },
  3: {
    label: "Level 3",
    desc: "Advanced",
    textColor: "text-[#BB3E00] dark:text-[#C44E1D]",
    bgColor: "bg-[#C44E1D]/10 dark:bg-[#C44E1D]/20",
  },
};

function normalizePartLevels(raw: any): Partial<Record<string, L>> {
  const out: Partial<Record<string, L>> = {};
  if (!raw || typeof raw !== "object") return out;
  const parts = [
    "part.1",
    "part.2",
    "part.3",
    "part.4",
    "part.5",
    "part.6",
    "part.7",
  ];
  for (const p of parts) {
    const num = p.split(".")[1];
    let v: any = raw[p];
    if (v == null && raw.part && typeof raw.part === "object")
      v = raw.part[num];
    if (v == null && raw[num] != null) v = raw[num];
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) out[p] = n as L;
  }
  return out;
}

/* Motion variants */
const headerVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.8,
    },
  },
};

const bannerVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18,
      mass: 0.7,
    },
  },
};

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (stagger: number = 0.06) => ({
    opacity: 1,
    transition: {
      type: "spring",
      staggerChildren: stagger,
      delayChildren: 0.1,
    },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 16,
      mass: 0.75,
    },
  },
};

/* ====== PAGE ====== */
export default function PracticePart() {
  const router = useRouter();
  const base = useBasePrefix("vi");
  const { partKey } = useParams<{ partKey: string }>();
  const sp = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const levelParam = Number(sp.get("level") ?? 1);
  const level: L = [1, 2, 3].includes(levelParam) ? (levelParam as L) : 1;

  const meta = PART_META[partKey] ?? {
    title: `Practice • ${partKey}`,
    defaultQuestions: 10,
    defaultDuration: 10,
  };

  const [tests, setTests] = React.useState<number[]>([]);
  const [progressByTest, setProgressByTest] = React.useState<AttemptMap>({});

  const [suggestedLevel, setSuggestedLevel] = React.useState<
    L | null | undefined
  >(undefined);
  const [loading, setLoading] = React.useState<boolean>(true);

  const [showSuggestModal, setShowSuggestModal] = React.useState(false);
  const [pendingLink, setPendingLink] = React.useState<string | null>(null);

  const [mustDoPlacement, setMustDoPlacement] = React.useState<boolean | null>(
    null
  );

  // Kiểm tra đã có placement test chưa
  React.useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setMustDoPlacement(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/placement/attempts?limit=1", {
          credentials: "include",
          cache: "no-store",
        });
        let done = false;
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          const items = Array.isArray(j?.items) ? j.items : [];
          done = items.length > 0;
        }
        if (!mounted) return;
        setMustDoPlacement(!done);
      } catch {
        if (!mounted) return;
        setMustDoPlacement(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  // Lấy suggested level theo part
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok) throw new Error("me-failed");
        const j = await r.json();
        const me = j?.user ?? j?.data ?? j;
        const levels = normalizePartLevels(me?.partLevels);
        const sl = (levels[partKey] ?? null) as L | null;
        if (mounted) setSuggestedLevel(sl);
      } catch {
        if (mounted) setSuggestedLevel(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [partKey]);

  // Load danh sách test + progress
  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const tr = await fetch(
          `/api/parts/${encodeURIComponent(partKey)}/tests?level=${level}`,
          { cache: "no-store" }
        );
        const tj = tr.ok ? await tr.json() : { tests: [] as number[] };
        if (!mounted) return;
        setTests(tj.tests || []);

        const pr = await fetch(
          `/api/practice/progress?partKey=${encodeURIComponent(
            partKey
          )}&level=${level}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!mounted) return;
        if (pr.ok) {
          const pj = await pr.json();
          const map = pj?.progress ?? pj?.progressByTest ?? {};
          const prog: AttemptMap = Object.fromEntries(
            Object.entries(map).map(([k, v]) => [
              Number(k),
              v as AttemptSummary,
            ])
          );
          setProgressByTest(prog);
        } else {
          setProgressByTest({});
        }
      } catch {
        if (!mounted) return;
        setTests([]);
        setProgressByTest({});
      } finally {
        setTimeout(() => mounted && setLoading(false), 150);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [partKey, level]);

  const isListening = /^part\.[1-4]$/.test(partKey);
  const locale = base.slice(1) || "vi";

  const placementHref = `${base}/placement`;

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-zinc-950 overflow-hidden">
      {/* subtle grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.1),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.12),_transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl xl:max-w-7xl px-4 xs:px-6 py-10 pt-20">
        {/* ===== HEADER ===== */}
        <motion.header
          className="mb-5"
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left block */}
            <div className="space-y-4 max-w-2xl">
              {/* Tag (Nghe / Đọc) */}
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl px-3 py-2 shadow-md ring-1 ring-white/60 dark:ring-zinc-700/70">
                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${
                    isListening
                      ? "from-sky-500 to-sky-600"
                      : "from-lime-500 to-lime-600"
                  } shadow-lg ring-2 ring-white/60`}
                >
                  <div className="absolute inset-0 rounded-full bg-white/40 blur-md" />
                  {isListening ? (
                    <Headphones className="h-5 w-5 text-white relative z-10" />
                  ) : (
                    <BookOpen className="h-5 w-5 text-white relative z-10" />
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    isListening
                      ? "text-sky-700 dark:text-sky-300"
                      : "text-lime-700 dark:text-lime-300"
                  }`}
                >
                  {isListening ? "Luyện Nghe TOEIC" : "Luyện Đọc TOEIC"}
                </span>
              </div>

              {/* Title row */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-zinc-100">
                    {meta.title}
                  </h1>
                </div>

                <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 max-w-xl leading-relaxed">
                  Mỗi Part được chia thành <strong>3 cấp độ</strong>. Chọn Level
                  phù hợp, luyện đề theo thời gian chuẩn TOEIC, và theo dõi tiến
                  độ ngay trên hệ thống.
                </p>
              </div>

              {/* Nếu bắt buộc placement */}
              <AnimatePresence>
                {mustDoPlacement && (
                  <motion.div
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs sm:text-sm text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
                    variants={bannerVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{
                      opacity: 0,
                      y: 4,
                      transition: {
                        type: "spring",
                        stiffness: 150,
                        damping: 20,
                        mass: 0.6,
                      },
                    }}
                  >
                    <Star className="w-4 h-4 text-amber-500" />
                    <span>
                      Nên làm{" "}
                      <Link
                        href={placementHref}
                        className="font-semibold underline underline-offset-4"
                      >
                        Placement Test
                      </Link>{" "}
                      trước để hệ thống gợi ý lộ trình chính xác hơn.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right block: Level switcher + history */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:gap-4 min-w-[230px]">
              <div className="flex justify-start sm:justify-end">
                <motion.div
                  className="rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/50 dark:border-zinc-800/80 shadow-lg px-4 py-3 w-full sm:w-auto"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 18,
                    mass: 0.7,
                    delay: 0.05,
                  }}
                >
                  <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-[0.16em]">
                    Cấp độ luyện tập
                  </p>
                  <LevelSwitcher
                    level={level}
                    suggestedLevel={suggestedLevel ?? undefined}
                    disabled={false}
                    tooltip={undefined}
                  />
                </motion.div>
              </div>

              <motion.div
                className="flex justify-start sm:justify-end"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 18,
                  mass: 0.7,
                  delay: 0.08,
                }}
              >
                <Link
                  href={`${base}/practice/history?partKey=${encodeURIComponent(
                    partKey
                  )}&level=${level}`}
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/50 dark:border-zinc-800/80 px-4 py-2.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-200 dark:to-zinc-400">
                    <History className="h-4 w-4 text-white dark:text-zinc-900" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Lịch sử luyện tập
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Xem lại kết quả
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* ===== GRID TESTS ===== */}
        <section className="space-y-8">
          {/* Banner gợi ý level */}
          <AnimatePresence>
            {suggestedLevel != null && (
              <motion.div
                className="inline-flex items-center gap-2 rounded-md border border-amber-100 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-900/25 px-3 py-2 shadow-sm max-w-full"
                variants={bannerVariants}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  y: 4,
                  transition: {
                    type: "spring",
                    stiffness: 160,
                    damping: 18,
                    mass: 0.5,
                  },
                }}
              >
                {/* Icon nhỏ */}
                <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-amber-500/90">
                  <Lightbulb className="h-3.5 w-3.5 text-white" />
                </div>

                {/* Text gợi ý */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-amber-800 dark:text-amber-200 whitespace-nowrap">
                    Gợi ý:
                  </span>

                  {/* Badge level nhỏ gọn */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-[1px] text-[11px] sm:text-xs font-semibold whitespace-nowrap ${levelConfig[suggestedLevel].textColor} ${levelConfig[suggestedLevel].bgColor} border border-current/15`}
                  >
                    {levelConfig[suggestedLevel].label}
                    <span className="hidden xs:inline opacity-75 text-[10px]">
                      · {levelConfig[suggestedLevel].desc}
                    </span>
                  </span>

                  <span className="text-[11px] text-amber-800/80 dark:text-amber-100/80 truncate">
                    phù hợp với trình độ hiện tại của bạn.
                  </span>
                </div>

                {/* CTA dạng link nhỏ, không phải button to */}
                {level !== suggestedLevel && (
                  <button
                    onClick={() => {
                      router.push(
                        `${base}/practice/${partKey}?level=${suggestedLevel}`
                      );
                    }}
                    className="
        ml-1
        inline-flex items-center gap-1
        text-[11px] sm:text-xs font-semibold
        text-amber-700 dark:text-amber-300
        hover:text-amber-600 dark:hover:text-amber-200
        hover:underline underline-offset-2
        transition-colors
        whitespace-nowrap
      "
                  >
                    Chuyển level
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <motion.div
              className="
      grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
      gap-3 xs:gap-4 sm:gap-5
      max-w-md xs:max-w-xl sm:max-w-2xl md:max-w-3xl
      mx-auto lg:max-w-none
    "
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              custom={0.06}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <TestCardSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : tests.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-24 text-center"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 0.8,
              }}
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 blur-3xl animate-pulse" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-zinc-800 dark:to-zinc-700 shadow-2xl ring-8 ring-white/50">
                  <Star className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                Chưa có đề thi cho Level {level}
              </h3>
              <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md">
                Hãy thử cấp độ khác hoặc quay lại sau. Admin có thể đang cập
                nhật thêm đề cho Part này.
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="
      grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
      gap-3 xs:gap-4 sm:gap-5
      max-w-md xs:max-w-xl sm:max-w-2xl md:max-w-3xl
      mx-auto lg:max-w-none
    "
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              custom={0.06}
            >
              {tests.map((testNum) => {
                const p = progressByTest[testNum];
                const href = `${base}/practice/${partKey}/${level}/${testNum}`;

                return (
                  <motion.div
                    key={testNum}
                    className="h-full"
                    variants={itemVariants}
                    onClickCapture={(e) => {
                      if (suggestedLevel != null && level !== suggestedLevel) {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingLink(href);
                        setShowSuggestModal(true);
                      }
                    }}
                    onClick={() => {
                      if (suggestedLevel == null || level === suggestedLevel) {
                        router.push(href);
                      }
                    }}
                  >
                    <TestCard
                      locale={locale}
                      partKey={partKey}
                      level={level}
                      test={testNum}
                      totalQuestions={meta.defaultQuestions}
                      durationMin={meta.defaultDuration}
                      attemptSummary={p}
                      disabled={false}
                      disabledHint={undefined}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>
      </div>

      {/* ===== MODALS ===== */}
      {suggestedLevel != null && (
        <LevelSuggestModal
          open={showSuggestModal}
          currentLevel={level}
          suggestedLevel={suggestedLevel}
          onContinue={() => {
            setShowSuggestModal(false);
            if (pendingLink) {
              router.push(pendingLink);
              setPendingLink(null);
            }
          }}
          onCancel={() => {
            setShowSuggestModal(false);
            setPendingLink(null);
          }}
        />
      )}
    </div>
  );
}
