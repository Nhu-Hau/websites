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
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import LevelSuggestModal from "@/components/features/test/LevelSuggestModal";
import { useAuth } from "@/context/AuthContext";

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

  React.useEffect(() => {
    if (authLoading || !user) {
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
    <div className="relative min-h-screen bg-[#DFD0B8] dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 transition-all duration-700 overflow-hidden">

      <div className="relative mx-auto max-w-[1350px] px-4 xs:px-6 py-10 pt-16">
        {/* ===== Header ===== */}
        <header className="relative z-10">
          <div className="mx-auto">
            <div className="flex flex-col gap-6 pt-6 xl:flex-row xl:items-start xl:justify-between">
              {/* Left */}
              <div className="flex flex-col items-start gap-4">
                {/* Tag: Luyện Nghe / Đọc */}
                <div className="group relative inline-flex items-center gap-3 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl px-3 py-2.5 shadow-lg ring-1 ring-white/30 dark:ring-zinc-700/50 transition-all duration-500 hover:shadow-xl hover:scale-[1.01] hover:ring-amber-300 dark:hover:ring-amber-600">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {isListening ? (
                    <>
                      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md ring-2 ring-white/50">
                        <div className="absolute inset-0 rounded-full bg-white/30 blur-md" />
                        <Headphones className="h-5 w-5 text-white relative z-10" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                        Luyện Nghe
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md ring-2 ring-white/50">
                        <div className="absolute inset-0 rounded-full bg-white/30 blur-md" />
                        <BookOpen className="h-5 w-5 text-white relative z-10" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                        Luyện Đọc
                      </span>
                    </>
                  )}
                  <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                </div>

                {/* Title với hiệu ứng 3D ánh kim – thu nhỏ */}
                <div className="group relative inline-flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-zinc-800/70 dark:to-zinc-700/70 px-4 py-3 shadow-xl ring-1 ring-amber-200/50 dark:ring-amber-700/40 backdrop-blur-xl transition-all duration-700 hover:shadow-2xl hover:scale-[1.01] hover:ring-amber-400 dark:hover:ring-amber-500">
                  {/* Glow 3D */}
                  <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-600/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Icon P 3D */}
                  <div className="relative">
                    <div className="absolute inset-0 scale-110 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 blur-lg opacity-60 group-hover:opacity-85 transition-opacity duration-500" />
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl ring-3 ring-white/60">
                      <span className="text-2xl font-black text-white drop-shadow-lg">
                        P
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="relative bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-50 bg-clip-text text-3xl sm:text-4xl lg:text-[2.6rem] font-black leading-tight text-transparent drop-shadow-md">
                    {meta.title}
                    <span className="absolute -inset-2 bg-gradient-to-r from-amber-400/25 to-orange-500/25 blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </h1>
                </div>

                {/* Mô tả – nhỏ nhẹ hơn */}
                <p className="max-w-2xl text-base leading-relaxed text-zinc-800 dark:text-zinc-200 font-normal">
                  Chọn cấp độ và đề thi để luyện tập hiệu quả. Hệ thống sẽ{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    lưu tiến độ
                  </span>{" "}
                  và{" "}
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    gợi ý cải thiện
                  </span>{" "}
                  phù hợp với khả năng của bạn.
                </p>
              </div>

              {/* Right: Level + History */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <div className="flex justify-center">
                  <LevelSwitcher
                    level={level}
                    suggestedLevel={suggestedLevel ?? undefined}
                    disabled={false}
                    tooltip={undefined}
                  />
                </div>

                <div className="flex-col h-full">
                  <Link
                    href={`${base}/practice/history?partKey=${encodeURIComponent(
                      partKey
                    )}&level=${level}`}
                    className="group relative flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-white/30 dark:border-zinc-700/50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/18 to-orange-500/18 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md ring-2 ring-white/50">
                      <History className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Lịch sử
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ===== Grid Tests ===== */}
        <section className="space-y-10 pt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: Math.max(tests?.length ?? 0, 9) }).map(
                (_, i) => (
                  <TestCardSkeleton key={i} />
                )
              )}
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 blur-3xl animate-pulse" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-zinc-800 dark:to-zinc-700 shadow-2xl ring-8 ring-white/50">
                  <Star className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                Chưa có đề thi
              </h3>
              <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
                Level {level} hiện chưa có bài tập. Vui lòng thử cấp độ khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tests.map((testNum) => {
                const p = progressByTest[testNum];
                const href = `${base}/practice/${partKey}/${level}/${testNum}`;

                return (
                  <div
                    key={testNum}
                    className="cursor-pointer transition-all duration-300"
                    onClickCapture={(e) => {
                      // Cho phép vào trang test cụ thể, modal sẽ hiện ở đó nếu chưa làm placement
                      if (suggestedLevel != null && level !== suggestedLevel) {
                        e.preventDefault();
                        e.stopPropagation();
                        setPendingLink(href);
                        setShowSuggestModal(true);
                      }
                    }}
                    onClick={() => {
                      // Cho phép vào trang test cụ thể ngay cả khi chưa làm placement
                      // Modal sẽ hiện trong trang test cụ thể
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
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {/* MandatoryPlacementModal chỉ hiện trong trang test cụ thể, không hiện ở đây */}
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
