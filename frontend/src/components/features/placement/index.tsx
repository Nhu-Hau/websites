/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePlacementTest } from "@/hooks/tests/usePlacementTest";
import { Sidebar } from "@/components/features/practice/Sidebar";
import { ResultsPanel } from "@/components/features/practice/ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/features/practice/StimulusCards";
import { useAuth } from "@/context/AuthContext";
import FocusHUD from "@/components/features/practice/FocusHUD";
import { toast } from "sonner";
import {
  ListChecks,
  Timer,
  MessageSquare,
  Loader2,
  Focus,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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
      // Scroll to top after submission
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }, [started, answered, isSubmitting, submit]);

  // Keyboard shortcut: F (only desktop)
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
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Mini TOEIC • 55 câu • 35 phút
          </p>
          <h1 className="text-2xl xs:text-[1.7rem] sm:text-3xl md:text-[2.1rem] font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
            Bài kiểm tra xếp trình độ TOEIC
          </h1>
          <p className="max-w-2xl text-sm sm:text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            Đề rút gọn giúp bạn ước lượng{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              điểm TOEIC 0–990
            </span>{" "}
            và nhận{" "}
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              lộ trình học cá nhân hóa
            </span>{" "}
            phù hợp điểm mạnh – điểm yếu từng kỹ năng.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          {/* Card số câu */}
          <div className="group flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:hover:border-zinc-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-900/40 dark:text-emerald-300">
              <ListChecks className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Số câu hỏi
              </p>
              <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">
                {total} câu
              </p>
            </div>
          </div>

          {/* Card thời gian */}
          <div className="group flex items-center gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:hover:border-zinc-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-900/40 dark:text-amber-300">
              <Timer className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                Thời gian
              </p>
              <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">
                {durationMin} phút
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="mt-16 min-h-[calc(100vh-5rem)] bg-slate-50/70 pb-24 dark:bg-zinc-950/70">
      <div className="w-full">
        {/* Sidebar (layout & width do Sidebar tự quản lý) */}
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

        {/* Main content */}
        <main
          className={`flex-1 pb-28 lg:pb-12 pt-6 sm:pt-8 px-5 lg:pl-6 transition-all duration-300 ${
            focusMode ? "lg:ml-[72px]" : "lg:ml-[260px]"
          }`}
        >
          <Header />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="inline-block h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
              <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Đang tải bài kiểm tra…
              </p>
            </div>
          ) : !started && !resp ? (
            <div className="py-12 sm:py-16">
              <div className="mx-auto max-w-md rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
                <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Sẵn sàng bắt đầu chưa?
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Bài kiểm tra gồm{" "}
                  <span className="font-semibold">{total} câu</span> trong{" "}
                  <span className="font-semibold">{durationMin} phút</span>. Sau
                  khi nộp, bạn sẽ nhận{" "}
                  <span className="font-semibold">kết quả & lộ trình học</span>{" "}
                  ngay lập tức.
                </p>
                <button
                  onClick={handleStart}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md"
                >
                  Bắt đầu làm bài
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-10">
              {/* Kết quả & AI insight */}
              {resp && (
                <>
                  {/* Ô nhận xét AI */}
                  {resp.attemptId && user?.access === "premium" && (
                    <section className="rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/95">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                            <MessageSquare className="h-4 w-4" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                              Nhận xét từ AI
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Phân tích điểm mạnh/yếu và lộ trình khuyến nghị
                            </p>
                          </div>
                        </div>

                        {!showInsight && (
                          <button
                            onClick={async () => {
                              if (insight) {
                                setShowInsight(true);
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(
                                    new CustomEvent(
                                      "chatbox:open-and-refresh"
                                    )
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
                                  if (typeof window !== "undefined") {
                                    window.dispatchEvent(
                                      new CustomEvent(
                                        "chatbox:open-and-refresh"
                                      )
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
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-sky-500 hover:to-sky-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {insightLoading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Đang tải...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3.5 w-3.5" />
                                {insight ? "Xem nhận xét" : "Tạo nhận xét"}
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {showInsight && insight && (
                        <div className="border-t border-zinc-200 pt-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="mb-2 text-base font-bold">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="mb-2 text-sm font-bold">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="mb-1 text-xs font-bold">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0 text-sm">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-2 list-disc list-inside space-y-1 text-sm">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-2 list-decimal list-inside space-y-1 text-sm">
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
                        <p className="py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Chưa có nhận xét. Hãy thử tải lại sau.
                        </p>
                      )}
                    </section>
                  )}

                  <ResultsPanel
                    resp={resp}
                    timeLabel={fmtTime(resp.timeSec)}
                    onToggleDetails={() => setShowDetails((s: any) => !s)}
                    showDetails={showDetails}
                  />
                </>
              )}

              {/* Câu hỏi */}
              <div className="space-y-6 sm:space-y-8">
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
              </div>
            </div>
          )}
        </main>
      </div>

      {/* HUD focus (floating) */}
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

      {/* Mobile bottom sheet điều hướng nhanh */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          {/* sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                <Focus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Điều hướng nhanh
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Đóng
              </button>
            </div>

            {/* tiến độ */}
            <div className="mb-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>
                  Câu{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {currentIndex + 1}
                  </span>{" "}
                  / {total}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {fmtTime(leftSec)}
                </span>
              </div>
            </div>

            {/* danh sách câu hỏi */}
            <div className="max-h-[42vh] overflow-y-auto pt-1">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2">
                {Array.from({ length: total }).map((_, i) => {
                  const idx = i;
                  const itemId = items[idx]?.id || "";
                  const hasAnswer = Object.prototype.hasOwnProperty.call(
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
                        "flex aspect-square w-full items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                        isCurrent
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : hasAnswer
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
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