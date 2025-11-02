"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ResultsPanel } from "@/components/parts/ResultsPanel";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/parts/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import type { ChoiceId, Item, Stimulus } from "@/types/tests";
import { Sidebar } from "@/components/parts/Sidebar";
import { Trophy, Gauge } from "lucide-react";

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
  testId: string;
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

export default function PlacementResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<
    Record<string, Stimulus>
  >({});
  const [showDetails, setShowDetails] = React.useState(false);

  // 🆕 fix type error: cần prop focusMode + onToggleFocus
  const [focusMode, setFocusMode] = React.useState(false);

  // ===== Fetch dữ liệu =====
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        let attemptData: Attempt | null = null;

        // load kết quả mới nhất sau khi nộp bài placement
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
              if (detailRes.ok) attemptData = await detailRes.json();
            }
          }
        } else {
          const res = await fetch(`/api/placement/attempts/${attemptId}`, {
            credentials: "include",
            cache: "no-store",
          });
          if (res.status === 401) {
            router.push("/auth/login");
            return;
          }
          if (res.ok) attemptData = (await res.json()) as Attempt;
        }

        if (!mounted || !attemptData) return;
        setAttempt(attemptData);

        // tải lại câu hỏi gốc để render
        const orderedRes = await fetch(
          `/api/placement/attempts/${encodeURIComponent(
            String(attemptData._id)
          )}/items`,
          { credentials: "include", cache: "no-store" }
        );

        if (orderedRes.ok) {
          const { items, stimulusMap } = (await orderedRes.json()) as ItemsResp;
          if (!mounted) return;
          setItems(items || []);
          setStimulusMap(stimulusMap || {});
        } else {
          const allIds = attemptData.allIds?.length
            ? attemptData.allIds
            : attemptData.items.map((i) => i.id);
          if (allIds.length) {
            const r = await fetch(`/api/placement/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ ids: allIds }),
            });
            if (r.ok) {
              const json = (await r.json()) as ItemsResp;
              const indexMap = new Map<string, number>(
                allIds.map((id, idx) => [id, idx])
              );
              const orderedItems = (json.items || [])
                .slice()
                .sort(
                  (a, b) =>
                    (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0)
                );
              if (!mounted) return;
              setItems(orderedItems);
              setStimulusMap(json.stimulusMap || {});
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [attemptId, router]);

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

  if (loading) {
    return (
      <div className="text-center py-20 pt-32">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent animate-spin rounded-full mx-auto" />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Đang tải kết quả...
        </p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="text-center py-20 pt-32">
        <p className="text-zinc-700 dark:text-zinc-300 font-medium">
          Không tìm thấy kết quả.
        </p>
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

  // ====== Render ======
  return (
    <div className="flex pt-16">
      <Sidebar
        items={items}
        answers={answers}
        resp={respLike as any}
        total={items.length}
        answered={Object.keys(answers).length}
        timeLabel={fmtTime(attempt.timeSec)}
        onSubmit={() => {}}
        onJump={(i) =>
          document
            .getElementById(`q-${i + 1}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        onToggleDetails={() => setShowDetails((s) => !s)}
        showDetails={showDetails}
        countdownSec={35 * 60}
        started
        onStart={() => {}}
        isAuthed
        onLoginRequest={() => {}}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode((v) => !v)}
      />

      <main
        className={`flex-1 px-4 sm:px-6 py-8 transition-all duration-300 ${
          focusMode ? "lg:ml-[50px]" : "lg:ml-[250px]"
        } pb-28 lg:pb-0`}
      >
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Kết quả bài kiểm tra trình độ
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(attempt.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/70">
              <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                TOEIC ước lượng:{" "}
                <strong className="text-blue-600 dark:text-blue-400">
                  {predicted.overall}
                </strong>{" "}
                / 990
              </span>
            </div>
          </div>
        </header>

        {/* Tổng quan kết quả */}
        <ResultsPanel
          resp={respLike as any}
          timeLabel={fmtTime(attempt.timeSec)}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
        />

        {/* Danh sách câu hỏi */}
        <section className="mt-8 space-y-6">
          {groups.map((g) =>
            g.stimulus?.part === "part.1" ? (
              <StimulusRowCard
                key={g.key}
                stimulus={g.stimulus}
                items={g.items}
                itemIndexMap={itemIndexMap}
                answers={answers}
                correctMap={correctMap}
                locked
                onPick={() => {}}
                showStimulusDetails={showDetails}
                showPerItemExplain={showDetails}
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
                onPick={() => {}}
                showStimulusDetails={showDetails}
                showPerItemExplain={showDetails}
              />
            )
          )}
        </section>
      </main>
    </div>
  );
}
