/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams } from "next/navigation";
import type { Item, Stimulus, ChoiceId } from "@/types/tests";
import { groupByStimulus } from "@/utils/groupByStimulus";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/parts/StimulusCards";
import { Sidebar } from "@/components/parts/Sidebar";
import { toast } from "sonner";
import {
  Layers,
  Hash,
  ListChecks,
  Timer,
  CalendarClock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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

const LISTENING_PARTS = new Set(["part.1", "part.2", "part.3", "part.4"]);

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getLevelColor(level: 1 | 2 | 3) {
  return level === 1
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
    : level === 2
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
    : "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300";
}

export default function HistoryAttemptDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [loading, setLoading] = React.useState(true);
  const [att, setAtt] = React.useState<AttemptDoc | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<
    Record<string, Stimulus>
  >({});
  const [showDetails, setShowDetails] = React.useState(false);

  // Load attempt + items
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

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
          toast.error("Không tìm thấy lịch sử này");
          setAtt(null);
          setItems([]);
          setStimulusMap({});
          return;
        }
        setAtt(found);

        const qs = new URLSearchParams({
          level: String(found.level),
          limit: "200",
        });
        if (typeof found.test === "number") qs.set("test", String(found.test));
        const rItems = await fetch(
          `/api/parts/${encodeURIComponent(found.partKey)}/items?${qs}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!rItems.ok) throw new Error("failed-items");
        const j = (await rItems.json()) as ItemsResp;
        if (!mounted) return;
        setItems(j.items || []);
        setStimulusMap(j.stimulusMap || {});
      } catch (e) {
        console.error(e);
        if (mounted) {
          toast.error("Không tải được dữ liệu lịch sử");
          setAtt(null);
          setItems([]);
          setStimulusMap({});
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

  // Fake resp để dùng lại UI "sau khi nộp"
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
  const answers: Record<string, ChoiceId> = React.useMemo(() => ({}), []);

  function jumpTo(i: number) {
    document
      .getElementById(`q-${i + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const isPerfect = respFake?.acc === 1;

  return (
    <div className="max-w-7xl mx-auto p-6 mt-16">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-bold">Xem lại bài đã làm</h1>

          {att && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-800/70 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <ListChecks className="h-4 w-4" />
                {att.correct}/{att.total}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/50 px-3 py-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {(att.acc * 100).toFixed(0)}%
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-800/70 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <Timer className="h-4 w-4" />
                {fmtTime(att.timeSec)}
              </span>
              {typeof att.test === "number" && (
                <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/50 px-3 py-1.5 text-sm font-semibold text-blue-800 dark:text-blue-300">
                  <Hash className="h-4 w-4" />
                  Test {att.test}
                </span>
              )}
              <span
                className={`
                  inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold
                  ${getLevelColor(att.level)}
                `}
              >
                <Layers className="h-4 w-4" />
                Level {att.level}
              </span>
              {atTime && (
                <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-800/70 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {new Date(atTime).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6">
        {/* ===== Sidebar: dùng lại Sidebar của trang luyện (trạng thái đã nộp) ===== */}
        <Sidebar
          items={items}
          answers={answers}
          resp={respFake as any} // đã nộp → Sidebar hiện legend, nút ẩn/hiện
          total={items.length}
          answered={0}
          timeLabel={respFake ? fmtTime(respFake.timeSec) : "--:--"}
          onSubmit={() => {}}
          onJump={jumpTo}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
          countdownSec={1} // không dùng trong trạng thái đã nộp
          started={true}
          onStart={() => {}}
          isAuthed={true}
          onLoginRequest={() => {}}
        />

        {/* Main Content */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : !att ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 p-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                Không tìm thấy bài làm
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Có thể bản ghi đã bị xóa hoặc không tồn tại.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* TỔNG QUAN – ĐƠN GIẢN, DỄ NHÌN */}
              <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-5">
                  TỔNG QUAN
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4">
                    <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Số câu đúng
                    </div>
                    <div className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">
                      {respFake ? `${respFake.correct} / ${respFake.total}` : "-- / --"}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Độ chính xác
                    </div>
                    <div className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {respFake ? `${(respFake.acc * 100).toFixed(0)}%` : "--%"}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Thời gian
                    </div>
                    <div className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">
                      {respFake ? fmtTime(respFake.timeSec) : "--:--"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetails((s) => !s)}
                  className={`
                    mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl
                    px-5 py-3 text-base font-semibold transition-all
                    ${
                      showDetails
                        ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                    }
                  `}
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-5 w-5" />
                      Ẩn chi tiết
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-5 w-5" />
                      Xem chi tiết đáp án
                    </>
                  )}
                </button>
              </section>

              {/* Review đáp án */}
              <section className="space-y-6">
                {groups.map((g) =>
                  g.stimulus?.part === "part.1" ? (
                    <StimulusRowCard
                      key={g.key}
                      stimulus={g.stimulus}
                      items={g.items}
                      itemIndexMap={itemIndexMap}
                      answers={{}}
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
                      answers={{}}
                      correctMap={correctMap}
                      locked={true}
                      onPick={() => {}}
                      showStimulusDetails={showDetails}
                      showPerItemExplain={showDetails}
                    />
                  )
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
