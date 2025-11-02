/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useProgressTest } from "@/hooks/useProgressTest";
import { Sidebar } from "../parts/Sidebar";
import { ResultsPanel } from "../parts/ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { StimulusRowCard, StimulusColumnCard } from "../parts/StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ListChecks, Timer } from "lucide-react";
import Link from "next/link";

type EligResp = {
  eligible: boolean;
  reason?:
    | "ok"
    | "waiting_window"
    | "no_practice_after_progress"
    | "no_practice_yet";
  since?: string;
  nextEligibleAt?: string | null;
  remainingMs?: number | null;
  windowMinutes?: number;
  suggestedAt?: string | null;
};

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0 phút";
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} ngày ${h} giờ`;
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
}

export default function ProgressPage() {
  const {
    items,
    stimulusMap,
    answers,
    setAnswers,
    resp,
    timeSec,
    showDetails,
    setShowDetails,
    loading,
    submit,
    total,
    answered,
    started,
    setStarted,
  } = useProgressTest();

  const { user } = useAuth();
  const isAuthed = !!user;

  // ---- NEW: eligibility state ----
  const [elig, setElig] = useState<EligResp | null>(null);
  const [eligLoading, setEligLoading] = useState(true);

  // poll eligibility nhẹ mỗi 60s để cập nhật remainingMs
  useEffect(() => {
    let mounted = true;
    let timer: number | null = null;

    const fetchElig = async () => {
      try {
        const r = await fetch("/api/progress/eligibility", {
          credentials: "include",
          cache: "no-store",
        });
        if (!mounted) return;
        if (!r.ok) {
          setElig(null);
          setEligLoading(false);
          return;
        }
        const j: EligResp = await r.json();
        setElig(j);
        setEligLoading(false);
      } catch {
        if (mounted) {
          setElig(null);
          setEligLoading(false);
        }
      }
    };

    fetchElig();
    // poll mỗi 60s
    timer = window.setInterval(fetchElig, 60_000) as unknown as number;

    return () => {
      mounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const [focusMode, setFocusMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationMin = 35;
  const countdownTotal = durationMin * 60;
  const leftSec = Math.max(0, countdownTotal - timeSec);
  const progress = total ? Math.round((answered / total) * 100) : 0;

  const { groups, itemIndexMap } = useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  const jumpTo = useCallback(
    (i: number) => {
      if (!started || resp) return;
      setCurrentIndex(i);
      document
        .getElementById(`q-${i + 1}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [started, resp]
  );

  const handleSubmit = useCallback(async () => {
    if (!started || answered === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submit();
    } finally {
      setIsSubmitting(false);
    }
  }, [started, answered, isSubmitting, submit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && window.innerWidth >= 1024)
        setFocusMode((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onLoginRequest = () =>
    toast.error("Vui lòng đăng nhập để bắt đầu làm bài");

  // ---- NEW: guard start by eligibility ----
  const handleStart = () => {
    if (!isAuthed) return onLoginRequest();

    if (eligLoading) {
      toast.info("Đang kiểm tra điều kiện làm Progress Test…");
      return;
    }
    if (!elig?.eligible) {
      // thông báo theo reason
      switch (elig?.reason) {
        case "no_practice_yet":
          toast.error("Bạn chưa có lượt luyện tập nào");
          break;
        case "no_practice_after_progress":
          toast.error(
            "Hãy luyện tập ít nhất một lần sau bài Progress gần nhất trước khi bắt đầu."
          );
          break;
        case "waiting_window":
        default: {
          const remain = elig?.remainingMs ?? 0;
          toast.info(
            `Chưa tới thời điểm làm Progress. Còn khoảng ${fmtDuration(
              remain
            )}.`
          );
        }
      }
      return;
    }

    setStarted(true);
    setTimeout(() => {
      document.getElementById("q-1")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const Header = () => (
    <header className="mb-8">
      <div className="mx-auto">
        <div className="flex flex-col gap-5 xl:flex-row sm:justify-between py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Progress Test
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-zinc-800/70 backdrop-blur-sm border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 transition-transform duration-300 group-hover:scale-110">
                <ListChecks className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Số câu hỏi
                </p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  {total} câu
                </p>
              </div>
            </div>

            <div className="group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-zinc-800/70 backdrop-blur-sm border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 transition-transform duration-300 group-hover:scale-110">
                <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Thời gian
                </p>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  {durationMin} phút
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Bài kiểm tra tiến bộ 7 phần để cập nhật điểm TOEIC ước lượng và nhận
          nhận xét theo từng Part.
        </p>
      </div>
    </header>
  );

  return (
    <div className="flex mt-16">
      <Sidebar
        items={items}
        answers={answers}
        resp={resp || null}
        total={total}
        answered={answered}
        timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
        onSubmit={handleSubmit}
        onJump={jumpTo}
        onToggleDetails={() => setShowDetails((s: any) => !s)}
        showDetails={showDetails}
        countdownSec={countdownTotal}
        started={started}
        onStart={handleStart} // 🔒 start có guard eligibility
        isAuthed={isAuthed}
        onLoginRequest={onLoginRequest}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((v) => !v)}
      />

      <main
        className={`flex-1 px-4 sm:px-6 py-8 transition-all duration-300 ${
          focusMode ? "lg:ml-[50px]" : "lg:ml-[250px]"
        } pb-28 lg:pb-0`}
      >
        <Header />
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Đang tải bài kiểm tra…
            </p>
          </div>
        ) : !started && !resp ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Nhấn{" "}
                <span className="text-emerald-600 dark:text-emerald-400 underline">
                  Bắt đầu
                </span>{" "}
                để làm bài
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Thời gian: <strong>{35} phút</strong> • {total} câu hỏi
              </p>
              {/* NEW: gợi ý đi Practice nếu chưa đủ điều kiện */}
              {elig && !elig.eligible && (
                <div className="mt-3 text-sm">
                  <Link
                    href="/practice"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    Đi luyện tập ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) =>
              g.stimulus?.part === "part.1" ? (
                <StimulusRowCard
                  key={g.key}
                  stimulus={g.stimulus}
                  items={g.items}
                  itemIndexMap={itemIndexMap}
                  answers={answers}
                  correctMap={(resp as any)?.answersMap}
                  locked={!!resp}
                  onPick={(itemId, choice) => {
                    setAnswers((p) => ({ ...p, [itemId]: choice }));
                    const idx = itemIndexMap.get(itemId);
                    if (typeof idx === "number") setCurrentIndex(idx);
                  }}
                  showStimulusDetails={!!resp && showDetails}
                  showPerItemExplain={!!resp && showDetails}
                />
              ) : (
                <StimulusColumnCard
                  key={g.key}
                  stimulus={g.stimulus}
                  items={g.items}
                  itemIndexMap={itemIndexMap}
                  answers={answers}
                  correctMap={(resp as any)?.answersMap}
                  locked={!!resp}
                  onPick={(itemId, choice) => {
                    setAnswers((p) => ({ ...p, [itemId]: choice }));
                    const idx = itemIndexMap.get(itemId);
                    if (typeof idx === "number") setCurrentIndex(idx);
                  }}
                  showStimulusDetails={!!resp && showDetails}
                  showPerItemExplain={!!resp && showDetails}
                />
              )
            )}

            {resp && (
              <ResultsPanel
                resp={resp}
                timeLabel={fmtTime(resp.timeSec)}
                onToggleDetails={() => setShowDetails((s: any) => !s)}
                showDetails={showDetails}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
