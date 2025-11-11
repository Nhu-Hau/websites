/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useBasePrefix } from "@/hooks/useBasePrefix";
import LevelSwitcher from "@/components/parts/LevelSwitcher";
import TestCard, {
  AttemptSummary,
  TestCardSkeleton,
} from "@/components/cards/TestCard";
import {
  History,
  Headphones,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
} from "lucide-react";

/* ====== META ====== */
const PART_META: Record<
  string,
  { title: string; defaultQuestions: number; defaultDuration: number }
> = {
  "part.1": { title: "Part 1", defaultQuestions: 6, defaultDuration: 6 },
  "part.2": { title: "Part 2", defaultQuestions: 25, defaultDuration: 11 },
  "part.3": { title: "Part 3", defaultQuestions: 39, defaultDuration: 20 },
  "part.4": { title: "Part 4", defaultQuestions: 30, defaultDuration: 13 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 17 },
  "part.6": { title: "Part 6", defaultQuestions: 16, defaultDuration: 12 },
  "part.7": { title: "Part 7", defaultQuestions: 54, defaultDuration: 55 },
};

type L = 1 | 2 | 3;
type AttemptMap = Record<number, AttemptSummary>;

/* ====== UTILS ====== */
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

/* ====== MODAL ====== */
function SuggestionModal({
  open,
  suggested,
  current,
  onSwitch,
  onContinue,
  onClose,
}: {
  open: boolean;
  suggested: number | null;
  current: number;
  onSwitch: () => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-[90%] max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h3 className="mb-2 text-center text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Nên luyện ở{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            Level {suggested}
          </span>
        </h3>

        <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Hệ thống khuyến nghị bạn luyện ở Level {suggested} để phù hợp với năng
          lực hiện tại. Bạn muốn chuyển sang Level {suggested} không? Bạn vẫn có
          thể tiếp tục Level {current} nếu muốn.
        </p>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onSwitch}
            className="flex-row items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 "
          >
            {/* Áp dụng class: whitespace-nowrap vào đây */}
            <div className="flex items-center gap-1 whitespace-nowrap">
              <RefreshCw className="h-4 w-4" />
              Chuyển sang Level {suggested}
            </div>
          </button>

          <button
            onClick={onContinue}
            className="flex-row items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {/* Áp dụng class: whitespace-nowrap vào đây */}
            <div className="flex items-center gap-1 whitespace-nowrap">
              <ArrowRight className="h-4 w-4" />
              Vẫn tiếp tục
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====== PAGE ====== */
export default function PracticePart() {
  const router = useRouter();
  const base = useBasePrefix("vi");
  const { partKey } = useParams<{ partKey: string }>();
  const sp = useSearchParams();

  const levelParam = Number(sp.get("level") ?? 1);
  const level: L = [1, 2, 3].includes(levelParam) ? (levelParam as L) : 1;

  const meta = PART_META[partKey] ?? {
    title: `Practice • ${partKey}`,
    defaultQuestions: 10,
    defaultDuration: 10,
  };

  const [tests, setTests] = React.useState<number[]>([]);
  const [progressByTest, setProgressByTest] = React.useState<AttemptMap>({});

  // suggestedLevel khởi tạo = undefined để tránh “lấp lánh” khi chưa fetch xong
  const [suggestedLevel, setSuggestedLevel] = React.useState<
    L | null | undefined
  >(undefined);
  const [loading, setLoading] = React.useState<boolean>(true);

  // modal
  const [showSuggestModal, setShowSuggestModal] = React.useState(false);
  const [pendingLink, setPendingLink] = React.useState<string | null>(null);

  /* ---- Fetch gợi ý level chỉ khi đổi part ---- */
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
        const user = j?.user ?? j?.data ?? j;
        const levels = normalizePartLevels(user?.partLevels);
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

  /* ---- Fetch tests + progress khi đổi part/level ---- */
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

  return (
    <div className="relative min-h-screen bg-zinc-50  bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 transition-colors duration-300">
      {/* --- Background gradient --- */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_-10%,rgba(24,24,27,0.12),transparent)] dark:bg-[radial-gradient(80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent)]" />

      <div className="relative mx-auto max-w-[1350px] px-4 xs:px-6 py-10 pt-16">
        {/* ===== Header ===== */}
        <header>
          <div className="mx-auto">
            <div className="flex flex-col gap-6 py-6 xl:flex-row sm:items-start sm:justify-between">
              {/* ---- Left: Title & Description ---- */}
              <div className="flex-1 space-y-4">
                <div className="group inline-flex items-center gap-2.5 rounded-full border px-3 py-2 xs:px-4 xs:py-2 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  {isListening ? (
                    <>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 transition-transform duration-300 group-hover:scale-110">
                        <Headphones className="h-[18px] w-[18px] text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Luyện Nghe
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 transition-transform duration-300 group-hover:scale-110">
                        <BookOpen className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Luyện Đọc
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-zinc-900 dark:text-zinc-50 transition-all duration-300 hover:scale-[1.01]">
                  {meta.title}
                </h1>

                <p className="text-base xs:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Chọn cấp độ và đề thi để luyện tập hiệu quả. Hệ thống sẽ{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    lưu tiến độ
                  </span>{" "}
                  và{" "}
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    gợi ý cải thiện
                  </span>{" "}
                  phù hợp nhất với bạn.
                </p>
              </div>

              {/* ---- Right: Level + History ---- */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <div className="flex justify-center">
                  <LevelSwitcher
                    level={level}
                    suggestedLevel={suggestedLevel ?? undefined}
                  />
                </div>

                <div className="flex-col h-full">
                  <Link
                    href={`${base}/practice/history?partKey=${encodeURIComponent(
                      partKey
                    )}&level=${level}`}
                    className="group flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 transition-transform duration-300 group-hover:scale-110">
                      <History className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Lịch sử
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===== Grid Tests ===== */}
        <section className="space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: Math.max(tests?.length ?? 0, 9) }).map(
                (_, i) => (
                  <TestCardSkeleton key={i} />
                )
              )}
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-zinc-100 dark:bg-zinc-900 p-6 ring-1 ring-zinc-200/60 dark:ring-zinc-800">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-700 dark:text-zinc-200">
                Chưa có đề thi
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Level {level} hiện chưa có bài tập. Vui lòng thử cấp độ khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tests.map((testNum) => {
                const p = progressByTest[testNum];
                const href = `${base}/practice/${partKey}/${level}/${testNum}`;
                return (
                  <div
                    key={testNum}
                    className="cursor-pointer"
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
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ===== Modal ===== */}
      <SuggestionModal
        open={showSuggestModal}
        suggested={suggestedLevel ?? null}
        current={level}
        onSwitch={() => {
          setShowSuggestModal(false);
          if (suggestedLevel)
            router.push(`${base}/practice/${partKey}?level=${suggestedLevel}`);
        }}
        onContinue={() => {
          setShowSuggestModal(false);
          if (pendingLink) router.push(pendingLink);
        }}
        onClose={() => setShowSuggestModal(false)}
      />
    </div>
  );
}
