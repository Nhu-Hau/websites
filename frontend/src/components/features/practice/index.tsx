/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePracticeTest } from "@/hooks/tests/usePracticeTest";
import { Sidebar } from "./Sidebar";
import { ResultsPanel } from "./ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { StimulusRowCard, StimulusColumnCard } from "./StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  ListChecks,
  Timer,
  Clock,
  BookOpen,
  Headphones,
  Focus,
} from "lucide-react";
import FocusHUD from "./FocusHUD";
import { ChoiceId } from "@/types/tests.types";

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function partLabel(partKey: string) {
  const n = partKey.match(/\d+/)?.[0];
  return n ? `Part ${n}` : partKey;
}

export default function PracticePage() {
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
    partKey,
    level,
    test,
  } = usePracticeTest();

  const { user } = useAuth();
  const isAuthed = !!user;

  const [focusMode, setFocusMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isListening = /^part\.[1-4]$/.test(partKey);
  const progress = total ? Math.round((answered / total) * 100) : 0;

  // For practice test, timeSec is elapsed time (not countdown)
  // We'll use a default duration for display purposes
  const durationMin = 35;
  const countdownTotal = durationMin * 60;
  const leftSec = useMemo(
    () => Math.max(0, countdownTotal - timeSec),
    [countdownTotal, timeSec]
  );

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
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Header
  const Header = () => (
    <header className="mb-8">
      <div className="mx-auto">
        <div className="flex flex-col gap-5 xl:flex-row sm:justify-between py-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {isListening ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Headphones className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">
                    Luyện Nghe
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">
                    Luyện Đọc
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              {partLabel(partKey)} - Level {level} - Test {test}
            </h1>
          </div>
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
                  {fmtTime(timeSec)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Luyện tập {partLabel(partKey)} ở Level {level} - Test {test}. Hoàn
          thành bài làm và xem kết quả chi tiết.
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
        resp={
          resp 
          ? { 
              ...resp, 
              answersMap: resp.answersMap 
                ? Object.fromEntries(
                    Object.entries(resp.answersMap).map(([key, value]) => [
                      key, 
                      { correctAnswer: value.correctAnswer as ChoiceId }
                    ])
                  ) 
                : undefined
            } 
          : null
        }
        total={total}
        answered={answered}
        timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
        onSubmit={handleSubmit}
        onJump={jumpTo}
        onToggleDetails={() => setShowDetails((s: any) => !s)}
        showDetails={showDetails}
        countdownSec={35 * 60}
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
                {total} câu hỏi • Làm bài theo tốc độ của bạn
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
                resp={resp as any}
                timeLabel={fmtTime(resp.timeSec)}
                onToggleDetails={() => setShowDetails((s: any) => !s)}
                showDetails={showDetails}
              />
            )}
          </div>
        )}
      </main>

      <FocusHUD
        started={started}
        resp={resp}
        focusMode={focusMode}
        durationMin={durationMin}
        total={total}
        currentIndex={currentIndex}
        leftSec={leftSec}
        progressPercent={progress}
        onStart={handleStart}
        onSubmit={handleSubmit}
        onOpenQuickNav={() => setMobileNavOpen(true)}
        onToggleFocus={() => setFocusMode((v) => !v)}
      />

      {/* Mobile bottom sheet (< lg) */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          {/* sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <Focus className="w-4 h-4" />
                Điều hướng nhanh
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                Đóng
              </button>
            </div>

            {/* tiến độ */}
            <div className="mb-3">
              <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  Câu {currentIndex + 1}/{total}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {fmtTime(leftSec)}
                </span>
              </div>
            </div>

            {/* danh sách câu hỏi */}
            <div className="max-h-[40vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: total }).map((_, i) => {
                  const idx = i;
                  const itemId = items[idx]?.id || "";
                  const answered = Object.prototype.hasOwnProperty.call(
                    answers,
                    itemId
                  );
                  const isCurrent = currentIndex === idx;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setMobileNavOpen(false);
                        jumpTo(idx);
                      }}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm font-semibold border transition",
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : answered
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                      ].join(" ")}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
