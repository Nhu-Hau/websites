/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePracticeTest } from "@/hooks/tests/usePracticeTest";
import { ResultsPanel } from "../test/ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { StimulusRowCard, StimulusColumnCard } from "../test/StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { toast } from "@/lib/toast";
import MandatoryPlacementModal from "../placement/PlacementMandatory";
import { ChoiceId } from "@/types/tests.types";
import { TestLayout } from "../test/TestLayout";
import { TestHeader } from "../test/TestHeader";
import { TestLoadingState } from "../test/TestLoadingState";
import { TestStartScreen } from "../test/TestStartScreen";
import { MobileQuickNavSheet } from "../test/MobileQuickNavSheet";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

/* ====== META ====== */
const PART_META: Record<
  string,
  { title: string; defaultQuestions: number; defaultDuration: number }
> = {
  "part.1": { title: "Part 1", defaultQuestions: 12, defaultDuration: 10 },
  "part.2": { title: "Part 2", defaultQuestions: 24, defaultDuration: 10 },
  "part.3": { title: "Part 3", defaultQuestions: 36, defaultDuration: 16 },
  "part.4": { title: "Part 4", defaultQuestions: 27, defaultDuration: 14 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 10 },
  "part.6": { title: "Part 6", defaultQuestions: 24, defaultDuration: 12 },
  "part.7": { title: "Part 7", defaultQuestions: 60, defaultDuration: 55 },
};

const PART7_BY_LEVEL: Record<1 | 2 | 3, { defaultQuestions: number; defaultDuration: number }> = {
  1: { defaultQuestions: 42, defaultDuration: 40 },
  2: { defaultQuestions: 60, defaultDuration: 55 },
  3: { defaultQuestions: 60, defaultDuration: 60 },
};

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function partLabel(partKey: string, t: any) {
  const n = partKey.match(/\d+/)?.[0];
  // return n ? `Part ${n}` : partKey;
  // Use t("meta.partX")
  if (n) return t(`meta.part${n}`);
  return partKey;
}

type Level = 1 | 2 | 3;

function normalizePartLevels(raw: any): Partial<Record<string, Level>> {
  const out: Partial<Record<string, Level>> = {};
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
    if (n === 1 || n === 2 || n === 3) out[p] = n as Level;
  }
  return out;
}

const levelConfig: Record<
  Level,
  {
    label: string;
    desc: string;
    textColor: string;
  }
> = {
  1: {
    label: "Level 1",
    desc: "Beginner",
    textColor: "text-[#347433] dark:text-[#347433]/90",
  },
  2: {
    label: "Level 2",
    desc: "Intermediate",
    textColor: "text-[#27548A] dark:text-[#27548A]/90",
  },
  3: {
    label: "Level 3",
    desc: "Advanced",
    textColor: "text-[#BB3E00] dark:text-[#BB3E00]/90",
  },
};

export default function PracticePage() {
  const t = useTranslations("Practice");
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

  const { user, loading: authLoading } = useAuth();
  const isAuthed = !!user;
  const router = useRouter();
  const base = useBasePrefix("vi");

  const [focusMode, setFocusMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isRetake, setIsRetake] = useState<boolean | null>(null);
  const [mustDoPlacement, setMustDoPlacement] = useState<boolean | null>(null);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [suggestedLevel, setSuggestedLevel] = useState<Level | null>(null);

  const isListening = /^part\.[1-4]$/.test(partKey);
  const progress = total ? Math.round((answered / total) * 100) : 0;

  // Lấy duration từ PART_META (Part 7 theo level)
  const baseMeta = PART_META[partKey] ?? {
    title: t("start.title", { part: partKey }),
    defaultQuestions: 10,
    defaultDuration: 35,
  };
  const meta =
    partKey === "part.7" && (level === 1 || level === 2 || level === 3) && PART7_BY_LEVEL[level]
      ? { ...baseMeta, ...PART7_BY_LEVEL[level] }
      : baseMeta;
  const durationMin = meta.defaultDuration;
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
      // Scroll to top sau khi nộp
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }, [started, answered, isSubmitting, submit]);

  // Keyboard shortcut: F (chỉ desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && window.innerWidth >= 1024) {
        setFocusMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Check if this is a retake when component loads
  useEffect(() => {
    if (
      !isAuthed ||
      !partKey ||
      !level ||
      !test ||
      loading ||
      started ||
      resp
    ) {
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/practice/history?partKey=${encodeURIComponent(
            partKey
          )}&level=${level}&test=${test}&limit=1`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.items && data.items.length > 0) {
          setIsRetake(true);
        } else if (mounted) {
          setIsRetake(false);
        }
      } catch (e) {
        console.error("Failed to check retake status", e);
        if (mounted) setIsRetake(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthed, partKey, level, test, loading, started, resp]);

  // Check if user needs to do placement test
  useEffect(() => {
    if (authLoading || !user) {
      setMustDoPlacement(false);
      setShowPlacementModal(false);
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
        if (!done) setShowPlacementModal(true);
      } catch {
        if (!mounted) return;
        setMustDoPlacement(true);
        setShowPlacementModal(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  // Lấy suggested level theo part
  useEffect(() => {
    if (!user || !partKey) {
      setSuggestedLevel(null);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok) throw new Error("me-failed");
        const j = await r.json();
        const me = j?.user ?? j?.data ?? j;
        const levels = normalizePartLevels(me?.partLevels);
        const sl = (levels[partKey] ?? null) as Level | null;
        if (mounted) setSuggestedLevel(sl);
      } catch {
        if (mounted) setSuggestedLevel(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, partKey]);

  const onLoginRequest = () =>
    toast.error(t("start.loginRequired"));

  const goPlacement = useCallback(() => {
    router.push(`${base}/placement`);
  }, [router, base]);

  const handleStart = () => {
    if (!isAuthed) return onLoginRequest();
    if (mustDoPlacement === true) {
      setShowPlacementModal(true);
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
      resp={
        resp
          ? {
            ...resp,
            answersMap: resp.answersMap
              ? Object.fromEntries(
                Object.entries(resp.answersMap).map(([key, value]) => [
                  key,
                  { correctAnswer: value.correctAnswer as ChoiceId },
                ])
              )
              : undefined,
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
          label: t("start.badge", {
            part: partLabel(partKey, t),
            level: level,
            test: test,
          }),
          dotColor: "bg-sky-500",
        }}
        title={t("start.title", { part: partLabel(partKey, t) })}
        description={
          isListening ? (
            t.rich("start.listeningDesc", {
              level,
              test,
              highlight: (chunks) => (
                <span className="font-semibold text-sky-600 dark:text-sky-400">
                  {chunks}
                </span>
              ),
              bold: (chunks) => <span className="font-semibold">{chunks}</span>,
            })
          ) : (
            t.rich("start.readingDesc", {
              level,
              test,
              highlight: (chunks) => (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {chunks}
                </span>
              ),
              bold: (chunks) => <span className="font-semibold">{chunks}</span>,
            })
          )
        }
        stats={{
          totalQuestions: total,
          durationMin,
          questionIconColor:
            "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300",
        }}
      />

      {loading ? (
        <TestLoadingState message={t("start.loading")} />
      ) : !started && !resp ? (
        <TestStartScreen
          description={
            isRetake === null ? (
              <span>{t("start.checking")}</span>
            ) : isRetake ? (
              t.rich("start.retakeDesc", {
                part: partLabel(partKey, t),
                level,
                test,
                bold: (chunks) => <b>{chunks}</b>,
              })
            ) : (
              t.rich("start.firstTimeDesc", {
                part: partLabel(partKey, t),
                level,
                test,
                bold: (chunks) => <b>{chunks}</b>,
              })
            )
          }
          buttonText={t("start.startButton")}
          onStart={handleStart}
        />
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {/* Nếu có kết quả thì show panel giống placement (trên cùng) */}
          {resp && (
            <ResultsPanel
              resp={resp as any}
              timeLabel={fmtTime(resp.timeSec)}
              onToggleDetails={() => setShowDetails((s: any) => !s)}
              showDetails={showDetails}
              variant="practice"
            />
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

      {/* MandatoryPlacementModal - chỉ hiện khi chưa làm placement test */}
      <MandatoryPlacementModal
        open={!!showPlacementModal}
        onGoPlacement={goPlacement}
      />
    </TestLayout>
  );
}
