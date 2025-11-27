/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { usePlacementTest } from "@/hooks/tests/usePlacementTest";
import { ResultsPanel } from "@/components/features/test/ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/features/test/StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { TestLayout } from "@/components/features/test/TestLayout";
import { TestHeader } from "@/components/features/test/TestHeader";
import { TestLoadingState } from "@/components/features/test/TestLoadingState";
import { TestStartScreen } from "@/components/features/test/TestStartScreen";
import { MobileQuickNavSheet } from "@/components/features/test/MobileQuickNavSheet";
import { AIInsightSection } from "@/components/features/test/AIInsightSection";
import { useTranslations } from "next-intl";

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlacementPage() {
  const t = useTranslations("placement");
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

  const durationMin = 35;
  const countdownTotal = durationMin * 60;
  const leftSec = useMemo(
    () => Math.max(0, countdownTotal - timeSec),
    [countdownTotal, timeSec]
  );
  const progress = total ? Math.round((answered / total) * 100) : 0;

  // Guard: Nếu đã có attempt placement, chặn vào trang này và chuyển sang trang kết quả gần nhất
  // Chỉ redirect nếu chắc chắn có attempt, còn không thì cho phép vào làm bài
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
          const total = Number(j?.total ?? 0);
          const last = Array.isArray(j?.items) ? j.items[0] : undefined;
          const attemptId = last?._id;
          // Chỉ redirect nếu chắc chắn có attempt (total > 0 và có attemptId)
          if (total > 0 && attemptId) {
            toast.info(t("complete"));
            router.replace(
              `${base}/placement/result/${encodeURIComponent(attemptId)}`
            );
          }
          // Nếu không có attempt hoặc không chắc chắn, cho phép vào làm bài
        }
        // Nếu API lỗi, vẫn cho phép vào làm bài (fail-safe)
      } catch {
        // ignore - cho phép vào làm bài nếu có lỗi
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, base, t]);

  // Group items
  const { groups, itemIndexMap } = useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  // Jump to question
  const jumpTo = useCallback(
    (i: number) => {
      if (!started) return;
      setCurrentIndex(i);
      document
        .getElementById(`q-${i + 1}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [started]
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
    toast.error(t("errors.loginRequired"));

  const handleStart = () => {
    if (!isAuthed) return onLoginRequest();
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
          label: t("test.label"),
          dotColor: "bg-emerald-500",
        }}
        title={t("test.title")}
        description={
          <>
            {t("page.desc.start")}{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {t("page.desc.score")}
            </span>{" "}
            {t("page.desc.middle")}{" "}
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              {t("page.desc.roadmap")}
            </span>{" "}
            {t("page.desc.end")}
          </>
        }
        stats={{
          totalQuestions: total,
          durationMin,
        }}
      />

      {loading ? (
        <TestLoadingState message={t("loadingTest")} />
      ) : !started && !resp ? (
        <TestStartScreen
          description={
            <>
              {t.rich("page.start.questions", {
                count: total,
                bold: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}{" "}
              {t.rich("page.start.minutes", {
                minutes: durationMin,
                bold: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}{" "}
              {t.rich("page.start.result", {
                bold: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </>
          }
          onStart={handleStart}
        />
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {/* Kết quả & AI insight */}
          {resp && (
            <>
              {resp.attemptId && (
                <AIInsightSection
                  attemptId={resp.attemptId}
                  userAccess={user?.access}
                  apiEndpoint={`/api/chat/insight/placement/${resp.attemptId}`}
                />
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
