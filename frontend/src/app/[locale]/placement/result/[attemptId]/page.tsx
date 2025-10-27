/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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

// ===== Helpers (KHÔNG tạo file riêng) =====
function roundToStep(n: number, step: number) {
  // chống lỗi số học nhị phân
  return Math.round((n + Number.EPSILON) / step) * step;
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function toToeicStep5(raw: number, min = 5, max = 495) {
  const r = roundToStep(raw, 5);
  // đảm bảo ra bội số của 5 sau khi clamp
  const c = clamp(r, min, max);
  return roundToStep(c, 5);
}
function toToeicStep10(raw: number, min = 10, max = 990) {
  const r = roundToStep(raw, 10);
  const c = clamp(r, min, max);
  return roundToStep(c, 10);
}

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlacementResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<
    Record<string, Stimulus>
  >({});
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        let attemptData: Attempt | null = null;

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
                {
                  credentials: "include",
                  cache: "no-store",
                }
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
          return;
        }

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
                (a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0)
              );
            if (!mounted) return;
            setItems(orderedItems);
            setStimulusMap(json.stimulusMap || {});
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [attemptId, router]);

  // Tính toán bổ sung
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

  function computeWeakParts(
    stats: Record<string, { total: number; correct: number; acc: number }>
  ) {
    return Object.entries(stats)
      .filter(([, s]) => s.acc < 0.7)
      .map(([k]) => k);
  }

  // Helpers giữ nguyên như bạn đã thêm:
  function roundToStep(n: number, step: number) {
    return Math.round((n + Number.EPSILON) / step) * step;
  }
  function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
  }
  function toToeicStep5(raw: number, min = 5, max = 495) {
    const r = roundToStep(raw, 5);
    const c = clamp(r, min, max);
    return roundToStep(c, 5);
  }
  function toToeicStep10(raw: number, min = 10, max = 990) {
    const r = roundToStep(raw, 10);
    const c = clamp(r, min, max);
    return roundToStep(c, 10);
  }

  // ✅ Luôn chuẩn hoá: L/R bội 5 (5..495), Overall bội 10 (10..990)
  function computePredicted(at: Attempt) {
    const rawL = (at.listening?.acc || 0) * 495;
    const rawR = (at.reading?.acc || 0) * 495;

    // Nếu server đã có predicted, vẫn lấy làm "gợi ý" nhưng normalize lại
    const baseL = at.predicted?.listening ?? rawL;
    const baseR = at.predicted?.reading ?? rawR;

    const listening = toToeicStep5(baseL, 5, 495);
    const reading = toToeicStep5(baseR, 5, 495);

    // overall: nếu server có overall thì normalize, còn không thì từ L+R
    const overallRaw = at.predicted?.overall ?? listening + reading;
    const overall = toToeicStep10(overallRaw, 10, 990);

    return { listening, reading, overall };
  }
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 mt-16 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Đang tải kết quả...
        </p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 mt-16 flex flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 p-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          Không tìm thấy kết quả
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Bản ghi có thể đã bị xóa.
        </p>
      </div>
    );
  }

  const partStats = computePartStats(attempt);
  const weakParts = attempt.weakParts ?? computeWeakParts(partStats);
  const predicted = computePredicted(attempt);

  const respLike = {
    ...attempt,
    partStats,
    weakParts,
    predicted, // <-- truyền xuống để ResultsPanel ưu tiên dùng, đảm bảo KHỚP header
    answersMap: attempt.items.reduce((m, it) => {
      m[it.id] = { correctAnswer: it.correctAnswer };
      return m;
    }, {} as Record<string, { correctAnswer: ChoiceId }>),
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 mt-16">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 p-3 shadow-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Kết quả bài kiểm tra trình độ
              </h1>
              <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
                {new Date(attempt.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/70 px-4 py-2">
            <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              TOEIC ước lượng:{" "}
              <strong className="font-bold text-blue-600 dark:text-blue-400">
                {predicted.overall}
              </strong>{" "}
              / 990
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:items-start">
        {/* Sidebar */}
        <div className="lg:col-span-1">
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
            started={true}
            onStart={() => {}}
            isAuthed={true}
            onLoginRequest={() => {}}
          />
        </div>

        {/* Main */}
        <main className="lg:col-span-3">
          <ResultsPanel
            resp={respLike as any}
            timeLabel={fmtTime(attempt.timeSec)}
            onToggleDetails={() => setShowDetails((s) => !s)}
            showDetails={showDetails}
          />

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
                  locked={true}
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
                  locked={true}
                  onPick={() => {}}
                  showStimulusDetails={showDetails}
                  showPerItemExplain={showDetails}
                />
              )
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
