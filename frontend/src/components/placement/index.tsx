/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePlacementTest } from "@/hooks/usePlacementTest";
import { Sidebar } from "../parts/Sidebar";
import { ResultsPanel } from "../parts/ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { StimulusRowCard, StimulusColumnCard } from "../parts/StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  ListChecks,
  Timer,
  Send,
  Play,
  Clock,
  Focus,
  MessageSquare,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/useBasePrefix";

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlacementPage() {
  const router = useRouter();
  const base = useBasePrefix("vi");
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // State cho AI insight
  const [showInsight, setShowInsight] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const durationMin = 35;
  const countdownTotal = durationMin * 60;
  const leftSec = useMemo(
    () => Math.max(0, countdownTotal - timeSec),
    [countdownTotal, timeSec]
  );
  const progress = total ? Math.round((answered / total) * 100) : 0;

  // Guard: Nếu đã có attempt placement, chặn vào trang này và chuyển sang trang kết quả gần nhất
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/placement/attempts?limit=1", {
          credentials: "include",
          cache: "no-store",
        });
        if (!mounted) return;
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          const last = Array.isArray(j?.items) ? j.items[0] : undefined;
          const attemptId = last?._id;
          if (attemptId) {
            toast.info(
              "Bạn đã hoàn thành Placement, chuyển đến trang kết quả."
            );
            router.replace(
              `${base}/placement/result/${encodeURIComponent(attemptId)}`
            );
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, base]);

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
        <div className="flex flex-col gap-5 xl:flex-row sm:justify-between">
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
        initialLeftSec={leftSec}
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
                Thời gian: <strong>{durationMin} phút</strong> - {total} câu hỏi
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
              <>
                <ResultsPanel
                  resp={resp}
                  timeLabel={fmtTime(resp.timeSec)}
                  onToggleDetails={() => setShowDetails((s: any) => !s)}
                  showDetails={showDetails}
                />

                {/* Ô nhận xét AI */}
                {resp.attemptId && user?.access === "premium" && (
                  <section className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Nhận xét từ AI
                      </h3>
                      {!showInsight && (
                        <button
                          onClick={async () => {
                            if (insight) {
                              setShowInsight(true);
                              // Mở ChatBox và trigger refresh để hiện message
                              if (typeof window !== "undefined") {
                                window.dispatchEvent(
                                  new CustomEvent("chatbox:open-and-refresh")
                                );
                              }
                              return;
                            }
                            if (!resp.attemptId) return;
                            setInsightLoading(true);
                            try {
                              const res = await fetch(
                                `/api/chat/insight/placement/${resp.attemptId}`,
                                {
                                  method: "POST",
                                  credentials: "include",
                                }
                              );
                              if (!res.ok)
                                throw new Error("Failed to load insight");
                              const json = await res.json();
                              if (json?.data?.insight) {
                                setInsight(json.data.insight);
                                setShowInsight(true);
                                // Mở ChatBox và trigger refresh để hiện message
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(
                                    new CustomEvent("chatbox:open-and-refresh")
                                  );
                                }
                              } else {
                                toast.error("Không thể tạo nhận xét");
                              }
                            } catch (e) {
                              console.error(e);
                              toast.error("Lỗi khi tải nhận xét");
                            } finally {
                              setInsightLoading(false);
                            }
                          }}
                          disabled={insightLoading}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {insightLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4" />
                              {insight ? "Xem nhận xét" : "Tải nhận xét"}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {showInsight && insight && (
                      <div className="prose prose-sm max-w-none dark:prose-invert border-t border-zinc-200 dark:border-zinc-700 pt-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-base font-bold mb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-sm font-bold mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-xs font-bold mb-1">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0 text-sm">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-2 space-y-1 text-sm">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                          }}
                        >
                          {insight}
                        </ReactMarkdown>
                      </div>
                    )}
                    {showInsight && !insight && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                        Chưa có nhận xét
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Mobile HUD - Chưa bắt đầu */}
      {!resp && !started && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg lg:hidden">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-5 py-4 shadow-2xl">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {durationMin} phút
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">/</span>
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl lg:hidden">
          <div
            className="
        flex items-center justify-between
        gap-2 sm:gap-4
        rounded-2xl
        bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
        border border-zinc-300 dark:border-zinc-700
        px-3 py-2.5 sm:px-5 sm:py-4
        shadow-2xl text-[11px] sm:text-sm font-medium
      "
          >
            <div className="flex items-center gap-2 sm:gap-4 text-zinc-800 dark:text-zinc-200">
              Câu{" "}
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                {currentIndex + 1}
              </span>
              / {total}
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                {fmtTime(leftSec)}
              </span>
              <div className="w-16 xs:w-44 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {" "}
              {/* NEW: nhóm nút */}
              <button
                onClick={() => setMobileNavOpen(true)} // NEW
                className="
            hidden sm:flex items-center gap-1.5
            px-3 py-1.5 rounded-xl
            bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
            text-zinc-800 dark:text-zinc-100 font-semibold
            transition-all hover:scale-105 active:scale-100
          "
                aria-label="Điều hướng nhanh"
              >
                <Focus className="w-4 h-4" />
              </button>
              {/* icon-only cho màn rất nhỏ */}
              <button
                onClick={() => setMobileNavOpen(true)} // NEW
                className="
            sm:hidden grid place-items-center
            w-9 h-9 rounded-xl
            bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
            text-zinc-800 dark:text-zinc-100 font-semibold
            transition-all hover:scale-105 active:scale-100
          "
                aria-label="Điều hướng nhanh"
              >
                <Focus className="w-4 h-4" />
              </button>
              <button
                onClick={handleSubmit}
                className="
            flex items-center gap-1.5 sm:gap-2
            px-3 py-1.5 sm:px-5 sm:py-2.5
            rounded-xl bg-black hover:bg-zinc-800
            text-white font-bold text-[11px] sm:text-sm
            transition-all hover:scale-105 active:scale-100
          "
              >
                <Send className="w-4 h-4" />
                Nộp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Nav Bottom Sheet - chỉ mobile */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {" "}
          {/* cao hơn HUD một chút */}
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

      {/* Focus Mode HUD */}
      {focusMode && !resp && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg">
          {!started ? (
            <>
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 px-5 py-4 shadow-2xl">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {durationMin} phút
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">/</span>
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
            </>
          ) : (
            <>
              <div
                className="
          flex items-center justify-between
          gap-2 sm:gap-4
          rounded-2xl
          bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
          border border-zinc-300 dark:border-zinc-700
          px-3 py-2.5 sm:px-5 sm:py-4
          shadow-2xl text-[11px] sm:text-sm font-medium
        "
              >
                <div className="flex items-center gap-2 sm:gap-4 text-zinc-800 dark:text-zinc-200">
                  Câu{" "}
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    {currentIndex + 1}
                  </span>
                  / {total}
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                    {fmtTime(leftSec)}
                  </span>
                  <div className="w-[70px] sm:w-32 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden ml-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="
            flex items-center gap-1.5 sm:gap-2
            px-3 py-1.5 sm:px-5 sm:py-2.5
            rounded-xl bg-black hover:bg-zinc-800
            text-white font-bold text-[11px] sm:text-sm
            transition-all hover:scale-105 active:scale-100
          "
                >
                  <Send className="w-4 h-4" />
                  Nộp
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
