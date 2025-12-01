"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { useParams } from "next/navigation";
import type { Item, Stimulus, ChoiceId } from "@/types/tests.types";
import { groupByStimulus } from "@/utils/groupByStimulus";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/features/test/StimulusCards";
import { ResultLayout } from "@/components/features/test/ResultLayout";
import { ResultHeader } from "@/components/features/test/ResultHeader";
import { TestLoadingState } from "@/components/features/test/TestLoadingState";
import { AIInsightSection } from "@/components/features/test/AIInsightSection";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import {
  Layers,
  Hash,
  CalendarClock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslations } from "next-intl";

type AttemptDoc = {
  _id: string;
  partKey: string;
  level: 1 | 2 | 3;
  test?: number | null;
  total: number;
  correct: number;
  acc: number;
  timeSec: number;
  submittedAt?: string;
  createdAt?: string;
  answersMap?: Record<string, { correctAnswer: string }>;
};

type HistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: AttemptDoc[];
};
type ItemsResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };

type PracticeAttemptDetail =
  | {
    items?: Array<{
      id: string;
      picked?: ChoiceId | null;
      correctAnswer?: ChoiceId;
      stimulusId?: string;
      part?: string;
    }>;
    answersMap?: Record<
      string,
      { picked?: ChoiceId | null; correctAnswer?: ChoiceId }
    >;
  }
  | any;

const LISTENING_PARTS = new Set(["part.1", "part.2", "part.3", "part.4"]);

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PracticeAttempt() {
  const t = useTranslations("Practice");
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [att, setAtt] = React.useState<AttemptDoc | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<
    Record<string, Stimulus>
  >({});
  const [showDetails, setShowDetails] = React.useState(false);

  // match Sidebar API với Practice Runner
  const [focusMode, setFocusMode] = React.useState(false);

  // picked của user
  const [answersPicked, setAnswersPicked] = React.useState<
    Record<string, ChoiceId>
  >({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // lấy list history rồi tìm attempt theo id
        const rHist = await fetch(`/api/practice/history?limit=500`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!rHist.ok) throw new Error("failed-history");
        const hist = (await rHist.json()) as HistoryResp;
        const found =
          (hist.items || []).find((x) => String(x._id) === String(attemptId)) ||
          null;

        if (!mounted) return;
        if (!found) {
          toast.error(t("result.notFoundHistory"));
          setAtt(null);
          setItems([]);
          setStimulusMap({});
          setAnswersPicked({});
          return;
        }
        setAtt(found);

        // cố lấy picked từ endpoint detail (nếu có)
        try {
          const rDetail = await fetch(
            `/api/practice/attempts/${encodeURIComponent(String(attemptId))}`,
            {
              credentials: "include",
              cache: "no-store",
            }
          );
          if (rDetail.ok) {
            const detail = (await rDetail.json()) as PracticeAttemptDetail;
            const pickedMap: Record<string, ChoiceId> = {};
            if (Array.isArray(detail?.items)) {
              for (const it of detail.items) {
                if (it && it.id && (it.picked as any) != null)
                  pickedMap[it.id] = it.picked as ChoiceId;
              }
            }
            if (detail?.answersMap && typeof detail.answersMap === "object") {
              for (const [id, v] of Object.entries(detail.answersMap)) {
                const p = (v as any)?.picked;
                if (p != null) pickedMap[id] = p as ChoiceId;
              }
            }
            if (mounted) setAnswersPicked(pickedMap);
          } else if (mounted) setAnswersPicked({});
        } catch {
          if (mounted) setAnswersPicked({});
        }

        // lấy items theo partKey/level/test để render
        const qs = new URLSearchParams({
          level: String(found.level),
          limit: "200",
        });
        if (typeof found.test === "number") qs.set("test", String(found.test));
        const rItems = await fetch(
          `/api/parts/${encodeURIComponent(found.partKey)}/items?${qs}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!rItems.ok) throw new Error("failed-items");
        const j = (await rItems.json()) as ItemsResp;
        if (!mounted) return;
        setItems(j.items || []);
        setStimulusMap(j.stimulusMap || {});
      } catch (e) {
        console.error(e);
        if (mounted) {
          toast.error(t("result.loadError"));
          setAtt(null);
          setItems([]);
          setStimulusMap({});
          setAnswersPicked({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  const { groups, itemIndexMap } = React.useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  // kết quả (như sau khi submit ở runner)
  const respFake = React.useMemo(() => {
    if (!att) return null;
    let L = 0,
      R = 0;
    for (const it of items) {
      if (LISTENING_PARTS.has(it.part)) L++;
      else R++;
    }
    const answersMap: Record<string, { correctAnswer: ChoiceId }> = {};
    if (att.answersMap) {
      for (const [id, v] of Object.entries(att.answersMap)) {
        answersMap[id] = { correctAnswer: v.correctAnswer as ChoiceId };
      }
    }
    return {
      total: att.total,
      correct: att.correct,
      acc: att.acc,
      timeSec: att.timeSec,
      level: att.level,
      listening: { total: L, correct: 0, acc: 0 },
      reading: { total: R, correct: 0, acc: 0 },
      answersMap,
    } as const;
  }, [att, items]);

  const correctMap: Record<string, ChoiceId> | undefined = React.useMemo(() => {
    if (!respFake) return undefined;
    const map: Record<string, ChoiceId> = {};
    Object.entries(respFake.answersMap || {}).forEach(([id, v]) => {
      map[id] = v.correctAnswer as ChoiceId;
    });
    return map;
  }, [respFake]);

  const atTime = att?.submittedAt || att?.createdAt || null;

  function jumpTo(i: number) {
    document
      .getElementById(`q-${i + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="mt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/70 dark:bg-zinc-950/80">
        <TestLoadingState message={t("result.loading")} />
      </div>
    );
  }

  if (!att) {
    return (
      <div className="mt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/70 dark:bg-zinc-950/80">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 px-5 py-6 shadow-lg text-center">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {t("result.notFound")}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("result.notFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResultLayout
      items={items}
      answers={answersPicked}
      resp={respFake as any}
      total={items.length}
      answered={Object.keys(answersPicked).length}
      timeLabel={respFake ? fmtTime(respFake.timeSec) : "--:--"}
      onJump={jumpTo}
      onToggleDetails={() => setShowDetails((s) => !s)}
      showDetails={showDetails}
      focusMode={focusMode}
      onToggleFocus={() => setFocusMode((v) => !v)}
    >
      {/* Header */}
      <ResultHeader
        badge={{
          label: t("result.badge"),
          dotColor: "bg-blue-500",
        }}
        title={t("result.title")}
        description={
          <>
            {atTime && (
              t.rich("result.completedAt", {
                time: new Date(atTime).toLocaleString(),
                bold: (chunks) => <span className="font-medium">{chunks}</span>
              })
            )}
            Level {att.level}
            {typeof att.test === "number" && ` • Test ${att.test}`}
          </>
        }
        stats={{
          correct: att.correct,
          total: att.total,
          timeLabel: fmtTime(att.timeSec),
        }}
      />
      {/* Tổng quan */}
      <section className="mb-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-6 shadow-lg">
        <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent mb-6">
          {t("result.heading")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("result.correct")}
            </p>
            <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {respFake?.correct}
              <span className="text-lg text-zinc-600 dark:text-zinc-400">
                /{respFake?.total}
              </span>
            </p>
          </div>

          <div className="text-center p-4 rounded-2xl bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("result.accuracy")}
            </p>
            <p className="text-3xl font-extrabold text-sky-700 dark:text-sky-300">
              {respFake ? (respFake.acc * 100).toFixed(1) : "--"}%
            </p>
          </div>

          <div className="text-center p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("result.time")}
            </p>
            <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">
              {respFake ? fmtTime(respFake.timeSec) : "--:--"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDetails((s) => !s)}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-base font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all dark:text-white"
        >
          {showDetails ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
          {showDetails ? t("result.hideDetails") : t("result.showDetails")}
        </button>
      </section>

      {/* AI Insight Section */}
      {att._id && (
        <div className="mb-8">
          <AIInsightSection
            attemptId={att._id}
            userAccess={user?.access}
            apiEndpoint={`/api/chat/insight/practice/${att._id}`}
          />
        </div>
      )}

      {/* Chi tiết từng câu (locked, giống runner sau submit) */}
      <section className="space-y-6">
        {groups.map((g) =>
          g.stimulus?.part === "part.1" ? (
            <StimulusRowCard
              key={g.key}
              stimulus={g.stimulus}
              items={g.items}
              itemIndexMap={itemIndexMap}
              answers={answersPicked}
              correctMap={correctMap}
              locked
              onPick={() => { }}
              showStimulusDetails={showDetails}
              showPerItemExplain={showDetails}
              testId="practice"
            />
          ) : (
            <StimulusColumnCard
              key={g.key}
              stimulus={g.stimulus}
              items={g.items}
              itemIndexMap={itemIndexMap}
              answers={answersPicked}
              correctMap={correctMap}
              locked
              onPick={() => { }}
              showStimulusDetails={showDetails}
              showPerItemExplain={showDetails}
              testId="practice"
            />
          )
        )}
      </section>
    </ResultLayout>
  );
}
