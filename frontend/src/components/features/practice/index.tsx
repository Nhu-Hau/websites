/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePlacementTest } from "@/hooks/tests/usePlacementTest";
import { Sidebar } from "./Sidebar";
import { ResultsPanel } from "./ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { StimulusRowCard, StimulusColumnCard } from "./StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  ListChecks,
  Timer,
  Focus,
  Play,
  Clock,
} from "lucide-react";

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlacementPage() {
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
  } = usePlacementTest();

  const { user } = useAuth();
  const isAuthed = !!user;

  const [focusMode, setFocusMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationMin = 35;
  const countdownTotal = durationMin * 60;
  const leftSec = Math.max(0, countdownTotal - timeSec);
  const progress = total ? Math.round((answered / total) * 100) : 0;

  // Group items
  const { groups, itemIndexMap } = useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  // Jump to question
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

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!started || answered === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submit();
    } finally {
      setIsSubmitting(false);
    }
  }, [started, answered, isSubmitting, submit]);

  // Keyboard shortcut: F
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && window.innerWidth >= 1024) {
        setFocusMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onLoginRequest = () =>
    toast.error("Vui lòng đăng nhập để bắt đầu làm bài");

  const handleStart = () => {
    if (!isAuthed) return onLoginRequest();
    setStarted(true);
    setTimeout(() => {
      document.getElementById("q-1")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Header (đã cải thiện trước đó)
  const Header = () => (
    <header className="mb-8">
      <div className="mx-auto">
        <div className="flex flex-col gap-5 xl:flex-row sm:justify-between py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Bài kiểm tra xếp trình độ
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
          Kiểm tra rút gọn giúp ước lượng điểm TOEIC từ{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            0–990
          </span>{" "}
          và nhận lộ trình học cá nhân hóa phù hợp nhất với bạn.
        </p>
      </div>
    </header>
  );

  return (
    <div className="flex mt-16">
      {/* Sidebar */}
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
        onStart={handleStart}
        isAuthed={isAuthed}
        onLoginRequest={onLoginRequest}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((v) => !v)}
      />

      {/* Main */}
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
                Thời gian: <strong>{durationMin} phút</strong> • {total} câu hỏi
              </p>
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

      {/* Mobile HUD - Chưa bắt đầu */}
      {!resp && !started && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden w-[calc(100%-2rem)] max-w-md">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-5 py-4 shadow-2xl">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {durationMin} phút
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">•</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {total} câu
              </span>
            </div>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:scale-105"
            >
              <Play className="w-4 h-4" />
              Bắt đầu
            </button>
          </div>
        </div>
      )}

      {/* Mobile HUD - Đang làm */}
      {!resp && started && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden w-[calc(100%-2rem)] max-w-md">
          <div className="flex items-center gap-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-4 py-3 shadow-2xl text-xs font-bold">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              Câu
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                {Math.min(currentIndex + 1, total)}
              </span>
              / {total}
            </div>
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <Clock className="w-3.5 h-3.5" />
              {fmtTime(leftSec)}
            </div>
            <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="px-3 py-1 rounded-md bg-black hover:bg-zinc-800 text-white text-xs transition"
            >
              Nộp
            </button>
          </div>
        </div>
      )}

      {/* Focus Mode HUD */}
      {focusMode && started && !resp && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden lg:flex items-center gap-4 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 shadow-2xl text-sm font-bold">
          <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
            Câu
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              {currentIndex + 1}
            </span>
            / {total}
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <Clock className="w-4 h-4" />
            {fmtTime(leftSec)}
          </span>
          <div className="w-32 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={() => setFocusMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all hover:scale-105"
          >
            <Focus className="w-4 h-4" />
            Mở lại
          </button>
        </div>
      )}
    </div>
  );
}
