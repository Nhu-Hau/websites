/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useProgressTest } from "@/hooks/tests/useProgressTest";
import { Sidebar } from "@/components/features/practice/Sidebar";
import { ResultsPanel } from "@/components/features/practice/ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { StimulusRowCard, StimulusColumnCard } from "@/components/features/practice/StimulusCards";
import { useAuth } from "@/context/AuthContext";
import FocusHUD from "@/components/features/practice/FocusHUD";
import { toast } from "sonner";
import {
  ListChecks,
  Timer,
  Clock,
  Focus,
  Play,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";

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
  const basePrefix = useBasePrefix();
  const {
    items,
    stimulusMap,
    answers,
    setAnswers,
    resp,
    timeSec,
    setTimeSec,
    showDetails,
    setShowDetails,
    loading,
    submit,
    total,
    answered,
    started,
    setStarted,
    version,
  } = useProgressTest();

  const { user } = useAuth();
  const isAuthed = !!user;

  // ---- NEW: eligibility state ----
  const [elig, setElig] = useState<EligResp | null>(null);
  const [eligLoading, setEligLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      // Scroll to top after submission
      window.scrollTo({ top: 0, behavior: "smooth" });
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
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight flex items-center gap-3 flex-wrap">
            Progress Test
            {typeof version === "number" &&
            Number.isFinite(version) &&
            version > 0 ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold uppercase tracking-wide">
                Test {version}
              </span>
            ) : null}
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
        onSubmitWithLeftSec={(left) => {
          // Đồng bộ timeSec dựa trên leftSec trước khi nộp (auto-submit từ Sidebar)
          const used = Math.max(0, countdownTotal - Math.max(0, left));
          setTimeSec(used);
        }}
        onJump={jumpTo}
        onToggleDetails={() => setShowDetails((s: any) => !s)}
        showDetails={showDetails}
        countdownSec={countdownTotal}
        initialLeftSec={leftSec}
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
                Thời gian: <strong>{35} phút</strong> - {total} câu hỏi
              </p>
              {/* NEW: gợi ý đi Practice nếu chưa đủ điều kiện */}
              {elig && !elig.eligible && (
                <div className="mt-3 text-sm">
                  <Link
                    href={`${basePrefix}/practice`}
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
            {/* Kết quả - di chuyển lên đầu */}
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
                  <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-6 shadow-lg">
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
                                `/api/chat/insight/progress/${resp.attemptId}`,
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

            {/* Câu hỏi */}
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
