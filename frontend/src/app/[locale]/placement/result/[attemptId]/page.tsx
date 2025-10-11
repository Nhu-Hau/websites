/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ResultsPanel } from "../../../../../components/parts/ResultsPanel";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "../../../../../components/parts/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import type { ChoiceId, Item, Stimulus } from "@/types/tests";

type AttemptItem = {
  id: string;
  part: string; // "part.1"..."part.7"
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
  level: 1 | 2 | 3 | 4;
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

const LISTENING_PARTS = new Set(["part.1", "part.2", "part.3", "part.4"]);

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
  const [stimulusMap, setStimulusMap] = React.useState<Record<string, Stimulus>>(
    {}
  );
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        // 1) Lấy attempt (hỗ trợ "last")
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

        if (!mounted) return;

        if (!attemptData) {
          setAttempt(null);
          setItems([]);
          setStimulusMap({});
          return;
        }

        setAttempt(attemptData);

        // 2) Lấy items theo đúng thứ tự khi làm bài
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

        // Fallback: dùng endpoint cũ + tự sort theo attempt.items/allIds
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

  // ===== Helpers tự tính nếu BE không trả partStats/weakParts/predicted =====

  function computePartStats(
    at: Attempt
  ): Record<string, { total: number; correct: number; acc: number }> {
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
  ): string[] {
    return Object.entries(stats)
      .filter(([, s]) => s.acc < 0.7)
      .map(([k]) => k);
  }

  function computePredicted(at: Attempt) {
    // nếu BE đã có thì dùng luôn
    if (at.predicted) return at.predicted;

    const round5 = (n: number, min: number, max: number) => {
      const x = Math.round(n / 5) * 5;
      return Math.min(max, Math.max(min, x));
    };

    const rawL = (at.listening?.acc || 0) * 495;
    const rawR = (at.reading?.acc || 0) * 495;
    return {
      listening: round5(rawL, 5, 495),
      reading: round5(rawR, 5, 495),
      overall: round5(rawL + rawR, 10, 990),
    };
  }

  // map đáp án đã chọn từ attempt → answers
  const answers: Record<string, ChoiceId> = React.useMemo(() => {
    const m: Record<string, ChoiceId> = {};
    attempt?.items.forEach((it) => {
      if (it.picked) m[it.id] = it.picked;
    });
    return m;
  }, [attempt]);

  // map đáp án đúng → correctMap
  const correctMap: Record<string, ChoiceId> | undefined = React.useMemo(() => {
    if (!attempt) return undefined;
    const m: Record<string, ChoiceId> = {};
    attempt.items.forEach((it) => {
      m[it.id] = it.correctAnswer;
    });
    return m;
  }, [attempt]);

  // group theo stimulus để render giống lúc làm
  const { groups, itemIndexMap } = React.useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 mt-16 text-sm text-gray-500">
        Đang tải kết quả…
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-7xl mx-auto p-6 mt-16 text-sm text-red-600">
        Không tìm thấy kết quả.
      </div>
    );
  }

  // ===== Đảm bảo ResultsPanel luôn có dữ liệu phân tích =====
  const partStats = computePartStats(attempt);
  const weakParts = attempt.weakParts ?? computeWeakParts(partStats);
  const predicted = computePredicted(attempt);

  const respLike = {
    total: attempt.total,
    correct: attempt.correct,
    acc: attempt.acc,
    listening: attempt.listening,
    reading: attempt.reading,
    timeSec: attempt.timeSec,
    level: attempt.level,
    answersMap: attempt.items.reduce((m, it) => {
      m[it.id] = { correctAnswer: it.correctAnswer };
      return m;
    }, {} as Record<string, { correctAnswer: ChoiceId }>),
    partStats,   // 👈 luôn có
    weakParts,   // 👈 luôn có
    predicted,   // 👈 luôn có (làm tròn bội số 5)
  };

  return (
    <div className="max-w-5xl mx-auto p-6 mt-16">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Kết quả Mini TOEIC 55 câu</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Mã lần làm: {attempt._id} • Nộp lúc{" "}
          {new Date(attempt.submittedAt).toLocaleString()}
        </p>
      </header>

      {/* 1) Panel kết quả lớn (có Phân tích theo Part & Gợi ý luyện tập) */}
      <ResultsPanel
        resp={respLike as any}
        timeLabel={fmtTime(attempt.timeSec)}
        onToggleDetails={() => setShowDetails((s) => !s)}
        showDetails={showDetails}
      />

      {/* 2) Toàn bộ đề — locked view (đúng thứ tự làm) */}
      <section className="mt-8 space-y-6">
        {groups.map((g) =>
          g.stimulus?.part === "part.1" ? (
            <StimulusRowCard
              key={g.key}
              groupKey={g.key}
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
              groupKey={g.key}
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

      <div className="mt-10 flex gap-3">
        <button
          className="rounded-xl border px-4 py-2 hover:bg-zinc-50"
          onClick={() => setShowDetails((s) => !s)}
        >
          {showDetails
            ? "Ẩn transcript/giải thích"
            : "Hiện transcript/giải thích"}
        </button>
        <button
          className="rounded-xl border px-4 py-2 hover:bg-zinc-50"
          onClick={() => router.push("/homePage")}
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}