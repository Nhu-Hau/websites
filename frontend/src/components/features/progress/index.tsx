/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useProgressTest } from "@/hooks/tests/useProgressTest";
import { ResultsPanel } from "@/components/features/test/ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/features/test/StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { TestLayout } from "@/components/features/test/TestLayout";
import { TestHeader } from "@/components/features/test/TestHeader";
import { TestLoadingState } from "@/components/features/test/TestLoadingState";
import { TestStartScreen } from "@/components/features/test/TestStartScreen";
import { MobileQuickNavSheet } from "@/components/features/test/MobileQuickNavSheet";
import { AIInsightSection } from "@/components/features/test/AIInsightSection";

type EligResp = {
  eligible: boolean;
  reason?:
    | "ok"
    | "waiting_window"
    | "no_practice_after_progress"
    | "no_practice_yet"
    | "insufficient_practice_tests";
  since?: string;
  nextEligibleAt?: string | null;
  remainingMs?: number | null;
  windowMinutes?: number;
  suggestedAt?: string | null;
  practiceTestCount?: number;
  requiredPracticeTests?: number;
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

  // ---- eligibility state ----
  const [elig, setElig] = useState<EligResp | null>(null);
  const [eligLoading, setEligLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // poll eligibility mỗi 60s
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }, [started, answered, isSubmitting, submit]);

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

  // guard start theo eligibility
  const handleStart = () => {
    if (!isAuthed) return onLoginRequest();

    if (eligLoading) {
      toast.info("Đang kiểm tra điều kiện làm Progress Test…");
      return;
    }
    if (!elig?.eligible) {
      switch (elig?.reason) {
        case "no_practice_yet":
          toast.error("Bạn chưa có lượt luyện tập nào");
          break;
        case "insufficient_practice_tests": {
          const current = elig.practiceTestCount ?? 0;
          const required = elig.requiredPracticeTests ?? 3;
          const remaining = required - current;
          toast.error(
            `Bạn cần hoàn thành ${remaining} bài Practice Test nữa (đã làm ${current}/${required} bài) để mở Progress Test.`
          );
          break;
        }
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


  return (
    <TestLayout
      items={items}
      answers={answers}
      resp={resp || null}
      total={total}
      answered={answered}
      timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
      onSubmit={handleSubmit}
      onSubmitWithLeftSec={(left) => {
        // auto-submit từ Sidebar: đồng bộ timeSec
        const used = Math.max(0, countdownTotal - Math.max(0, left));
        setTimeSec(used);
      }}
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
      durationMin={durationMin}
      currentIndex={currentIndex}
      leftSec={leftSec}
      progressPercent={progress}
      onOpenQuickNav={() => setMobileNavOpen(true)}
      mobileNavOpen={mobileNavOpen}
    >
      <TestHeader
        badge={{
          label: `Progress Test • 7 phần • ${durationMin} phút`,
          dotColor: "bg-sky-500",
        }}
        title={`Bài kiểm tra tiến độ`}
        description={
          <>
            Bài Progress gồm đủ{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              7 phần TOEIC
            </span>{" "}
            để cập nhật{" "}
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              điểm ước lượng 0–990
            </span>{" "}
            và theo dõi tiến bộ sau mỗi chu kỳ luyện tập.
          </>
        }
        stats={{
          totalQuestions: total,
          durationMin,
          questionIconColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
        }}
      />

      {loading ? (
        <TestLoadingState message="Đang tải bài kiểm tra…" />
      ) : !started && !resp ? (
        <TestStartScreen
          description={
            <>
              Thời gian: <strong>{durationMin} phút</strong> – {total} câu hỏi.
              Sau khi nộp bạn sẽ nhận kết quả mới nhất để so sánh tiến bộ.
              {elig && !elig.eligible && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                  {elig.reason === "insufficient_practice_tests" ? (
                    <>
                      <p className="mb-1 font-medium text-amber-900 dark:text-amber-100">
                        Bạn cần hoàn thành ít nhất 3 bài Practice Test
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Đã làm: {elig.practiceTestCount ?? 0}/{elig.requiredPracticeTests ?? 3} bài
                      </p>
                      <a
                        href={`${basePrefix}/practice`}
                        className="mt-2 inline-block font-semibold text-amber-700 underline dark:text-amber-300"
                      >
                        Đi luyện tập thêm →
                      </a>
                    </>
                  ) : elig.reason === "waiting_window" && elig.remainingMs != null && elig.remainingMs > 0 ? (
                    <>
                      <p className="mb-1 font-medium text-amber-900 dark:text-amber-100">
                        Chưa tới thời điểm làm Progress Test
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        ⏱️ Còn lại: <strong>{fmtDuration(elig.remainingMs)}</strong>
                      </p>
                      {elig.nextEligibleAt && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                          Sẽ mở vào: {new Date(elig.nextEligibleAt).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="mb-1 font-medium text-amber-900 dark:text-amber-100">
                        Có vẻ bạn chưa đủ điều kiện làm Progress Test.
                      </p>
                      <a
                        href={`${basePrefix}/practice`}
                        className="font-semibold text-amber-700 underline dark:text-amber-300"
                      >
                        Đi luyện tập thêm trước khi làm Progress Test
                      </a>
                    </>
                  )}
                </div>
              )}
            </>
          }
          buttonText="Bắt đầu Progress Test"
          onStart={handleStart}
        />
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {/* Kết quả + AI insight */}
          {resp && (
            <>
              <ResultsPanel
                resp={resp}
                timeLabel={fmtTime(resp.timeSec)}
                onToggleDetails={() => setShowDetails((s: any) => !s)}
                showDetails={showDetails}
              />

              {resp.attemptId && (
                <AIInsightSection
                  attemptId={resp.attemptId}
                  userAccess={user?.access}
                  apiEndpoint={`/api/chat/insight/progress/${resp.attemptId}`}
                />
              )}
            </>
          )}

          {/* Câu hỏi */}
          <section className="space-y-6 sm:space-y-8">
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
          </section>
        </div>
      )}

      <MobileQuickNavSheet
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        total={total}
        currentIndex={currentIndex}
        leftSec={leftSec}
        progress={progress}
        items={items}
        answers={answers}
        onJump={jumpTo}
        fmtTime={fmtTime}
      />
    </TestLayout>
  );
}
