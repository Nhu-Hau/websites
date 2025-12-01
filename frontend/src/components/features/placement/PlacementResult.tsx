"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ResultsPanel } from "@/components/features/test/ResultsPanel";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/features/test/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import type { ChoiceId, Item, Stimulus } from "@/types/tests.types";
import { ResultLayout } from "@/components/features/test/ResultLayout";
import { ResultHeader } from "@/components/features/test/ResultHeader";
import { TestLoadingState } from "@/components/features/test/TestLoadingState";
import { AIInsightSection } from "@/components/features/test/AIInsightSection";
import { useAuth } from "@/context/AuthContext";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { useTranslations } from "next-intl";

type AttemptItem = {
  id: string;
  part: string;
  picked: ChoiceId | null;
  correctAnswer: ChoiceId;
  isCorrect: boolean;
};

type Attempt = {
  _id: string;
  userId: string;
  test?: number | null;
  total: number;
  correct: number;
  acc: number;
  listening: { total: number; correct: number; acc: number };
  reading: { total: number; correct: number; acc: number };
  level: 1 | 2 | 3;
  items: AttemptItem[];
  timeSec: number;
  startedAt?: string;
  submittedAt: string;
  version?: string;
  partStats?: Record<string, { total: number; correct: number; acc: number }>;
  weakParts?: string[];
  predicted?: { overall: number; listening: number; reading: number };
  allIds?: string[];
};

type ItemsResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function orderItemsForAttempt(rawItems: Item[], allowedIds: string[]) {
  if (!allowedIds?.length) return rawItems;

  const queues = new Map<string, number[]>();
  allowedIds.forEach((id, idx) => {
    const list = queues.get(id);
    if (list) {
      list.push(idx);
    } else {
      queues.set(id, [idx]);
    }
  });

  const withOrder: { item: Item; order: number }[] = [];
  for (const item of rawItems) {
    const queue = queues.get(item.id);
    if (!queue?.length) continue;
    const order = queue.shift()!;
    withOrder.push({ item, order });
  }

  if (withOrder.length !== allowedIds.length && process.env.NODE_ENV === "development") {
    console.warn(
      "[PlacementResult] Items mismatch:",
      { expected: allowedIds.length, received: withOrder.length }
    );
  }

  return withOrder.sort((a, b) => a.order - b.order).map((entry) => entry.item);
}

export default function PlacementResult() {
  const t = useTranslations("placement");
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const basePrefix = useBasePrefix();

  const [loading, setLoading] = React.useState(true);
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<
    Record<string, Stimulus>
  >({});
  const [showDetails, setShowDetails] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [focusMode, setFocusMode] = React.useState(false);

  // AI insight
  const { user } = useAuth();

  // ===== Fetch dữ liệu =====
  React.useEffect(() => {
    let mounted = true;
    setError(null);

    (async () => {
      try {
        setLoading(true);
        let attemptData: Attempt | null = null;

        // load kết quả mới nhất
        if (attemptId === "last") {
          const hist = await fetch(`/api/placement/attempts?limit=1&page=1`, {
            credentials: "include",
            cache: "no-store",
          });
          if (hist.ok) {
            const j = await hist.json();
            const last = j?.items?.[0];
            if (last?._id) {
              const detailRes = await fetch(
                `/api/placement/attempts/${last._id}`,
                { credentials: "include", cache: "no-store" }
              );
              if (detailRes.ok) {
                attemptData = await detailRes.json();
              } else {
                const errorText = await detailRes.text();
                console.error("Failed to fetch attempt detail:", errorText);
                if (mounted) {
                  setError(
                    t("resultPage.errors.detail", { status: detailRes.status })
                  );
                }
              }
            } else if (mounted) {
              setError(t("errors.notFound"));
            }
          } else {
            const errorText = await hist.text();
            console.error("Failed to fetch attempt history:", errorText);
            if (mounted) {
              setError(
                t("resultPage.errors.history", { status: hist.status })
              );
            }
          }
        } else {
          const res = await fetch(`/api/placement/attempts/${attemptId}`, {
            credentials: "include",
            cache: "no-store",
          });
          if (res.status === 401) {
            router.push(`${basePrefix}/login`);
            return;
          }
          if (res.ok) {
            attemptData = (await res.json()) as Attempt;
          } else {
            const errorText = await res.text();
            console.error("Failed to fetch attempt:", res.status, errorText);
            if (mounted) {
              setError(
                t("resultPage.errors.result", {
                  status: res.status,
                  message: errorText || t("errors.unknown"),
                })
              );
            }
          }
        }

        if (!mounted) return;

        if (!attemptData) {
          setLoading(false);
          return;
        }

        setAttempt(attemptData);
        const allowedIds =
          attemptData.allIds?.length
            ? attemptData.allIds
            : attemptData.items?.map((i) => i.id) || [];

        // tải lại câu hỏi gốc để render đúng thứ tự đề
        const orderedRes = await fetch(
          `/api/placement/attempts/${encodeURIComponent(
            String(attemptData._id)
          )}/items`,
          { credentials: "include", cache: "no-store" }
        );

        if (orderedRes.ok) {
          const data = (await orderedRes.json()) as ItemsResp;
          const orderedItems = orderItemsForAttempt(data.items || [], allowedIds);
          if (!mounted) return;
          setItems(orderedItems);
          setStimulusMap(data.stimulusMap || {});
        } else {
          // fallback: fetch theo list id lưu trong attempt
          const idsToFetch = allowedIds.length
            ? allowedIds
            : attemptData.items?.map((i) => i.id) || [];
          if (idsToFetch.length) {
            const r = await fetch(`/api/placement/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ ids: idsToFetch }),
            });
            if (r.ok) {
              const json = (await r.json()) as ItemsResp;
              const orderedItems = orderItemsForAttempt(
                json.items || [],
                idsToFetch
              );
              if (!mounted) return;
              setItems(orderedItems);
              setStimulusMap(json.stimulusMap || {});
            } else {
              const errorText = await r.text();
              console.error("Failed to fetch items from fallback:", errorText);
              if (mounted) {
                setError(
                  t("resultPage.errors.questions", {
                    status: r.status,
                    message: errorText || t("errors.unknown"),
                  })
                );
              }
            }
          } else if (mounted) {
            setError(t("errors.noQuestions"));
          }
        }
      } catch (e) {
        console.error("Error fetching placement result:", e);
        if (mounted) {
          setError(
            t("resultPage.errors.loadData", {
              message: e instanceof Error ? e.message : t("errors.unknown"),
            })
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [attemptId, router, basePrefix]);

  // ====== Compute dữ liệu ======
  const answers = React.useMemo(() => {
    const m: Record<string, ChoiceId> = {};
    attempt?.items.forEach((it) => it.picked && (m[it.id] = it.picked));
    return m;
  }, [attempt]);

  const correctMap = React.useMemo(() => {
    if (!attempt) return undefined;
    const m: Record<string, ChoiceId> = {};
    attempt.items.forEach((it) => (m[it.id] = it.correctAnswer));
    return m;
  }, [attempt]);

  const { groups, itemIndexMap } = React.useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  // ====== Derived values ======
  function computePartStats(at: Attempt) {
    if (at.partStats) return at.partStats;
    const byPart: Record<string, { total: number; correct: number }> = {};
    for (const it of at.items) {
      if (!byPart[it.part]) byPart[it.part] = { total: 0, correct: 0 };
      byPart[it.part].total += 1;
      if (it.isCorrect) byPart[it.part].correct += 1;
    }
    const out: Record<string, { total: number; correct: number; acc: number }> =
      {};
    for (const [k, v] of Object.entries(byPart)) {
      out[k] = {
        total: v.total,
        correct: v.correct,
        acc: v.total ? v.correct / v.total : 0,
      };
    }
    return out;
  }

  function computePredicted(at: Attempt) {
    const rawL = (at.listening?.acc || 0) * 495;
    const rawR = (at.reading?.acc || 0) * 495;
    const baseL = at.predicted?.listening ?? rawL;
    const baseR = at.predicted?.reading ?? rawR;
    const listening = Math.round(baseL / 5) * 5;
    const reading = Math.round(baseR / 5) * 5;
    const overall = Math.min(990, listening + reading);
    return { listening, reading, overall };
  }

  // ====== Early states (loading / error / not found) ======
  if (loading) {
    return (
      <div className="mt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/70 dark:bg-zinc-950/80">
        <TestLoadingState message={t("loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/70 dark:bg-zinc-950/80">
        <div className="max-w-md w-full rounded-2xl border border-red-200/70 dark:border-red-800/80 bg-white/95 dark:bg-zinc-900/95 px-5 py-6 shadow-lg">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            {t("resultPage.reload")}
          </button>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="pt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/70 dark:bg-zinc-950/80">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 px-5 py-6 shadow-lg text-center">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {t("errors.notFound")}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t("resultPage.attemptId", { id: attemptId })}
          </p>
        </div>
      </div>
    );
  }

  const partStats = computePartStats(attempt);
  const predicted = computePredicted(attempt);
  const respLike = {
    ...attempt,
    partStats,
    predicted,
    answersMap: attempt.items.reduce((m, it) => {
      m[it.id] = { correctAnswer: it.correctAnswer };
      return m;
    }, {} as Record<string, { correctAnswer: ChoiceId }>),
  };

  // ====== Render chính ======
  return (
    <ResultLayout
      items={items}
      answers={answers}
      resp={respLike as any}
      total={items.length}
      answered={Object.keys(answers).length}
      timeLabel={fmtTime(attempt.timeSec)}
      onJump={(i) =>
        document
          .getElementById(`q-${i + 1}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      onToggleDetails={() => setShowDetails((s) => !s)}
      showDetails={showDetails}
      focusMode={focusMode}
      onToggleFocus={() => setFocusMode((v) => !v)}
    >
      {/* Header */}
      <ResultHeader
        badge={{
          label: t("result.label"),
          dotColor: "bg-emerald-500",
        }}
        title={t("result.title")}
        description={t.rich("result.description", {
          time: (chunks) => <span className="font-medium">{chunks}</span>,
          datetime: new Date(attempt.submittedAt).toLocaleString(),
        })}
        stats={{
          correct: attempt.correct,
          total: attempt.total,
          timeLabel: fmtTime(attempt.timeSec),
          questionIconColor:
            "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
          timeIconColor:
            "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
        }}
      />

      {/* Tổng quan + phân tích (dùng ResultsPanel pro) */}
      <ResultsPanel
        resp={respLike as any}
        timeLabel={fmtTime(attempt.timeSec)}
        onToggleDetails={() => setShowDetails((s) => !s)}
        showDetails={showDetails}
      />

      {/* AI Insight Section */}
      {attempt._id && (
        <div className="mt-8">
          <AIInsightSection
            attemptId={attempt._id}
            userAccess={user?.access}
            apiEndpoint={`/api/chat/insight/placement/${attempt._id}`}
          />
        </div>
      )}

      {/* Danh sách câu hỏi */}
      <section className="mt-8 space-y-6 sm:space-y-8">
        {items.length === 0 ? (
          <div className="text-center py-10 sm:py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
              {t("resultPage.empty.title")}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("resultPage.empty.stats", {
                items: items.length,
                groups: groups.length,
              })}
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-10 sm:py-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">
              {t("resultPage.groupError.title")}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("resultPage.groupError.stats", {
                items: items.length,
                keys: Object.keys(stimulusMap).length,
              })}
            </p>
          </div>
        ) : (
          groups.map((g) =>
            g.stimulus?.part === "part.1" ? (
              <StimulusRowCard
                key={g.key}
                stimulus={g.stimulus}
                items={g.items}
                itemIndexMap={itemIndexMap}
                answers={answers}
                correctMap={correctMap}
                locked
                onPick={() => { }}
                showStimulusDetails={showDetails}
                showPerItemExplain={showDetails}
                testId="placement"
              />
            ) : (
              <StimulusColumnCard
                key={g.key}
                stimulus={g.stimulus}
                items={g.items}
                itemIndexMap={itemIndexMap}
                answers={answers}
                correctMap={correctMap}
                locked
                onPick={() => { }}
                showStimulusDetails={showDetails}
                showPerItemExplain={showDetails}
                testId="placement"
              />
            )
          )
        )}
      </section>
    </ResultLayout>
  );
}
