"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

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
function getLevelColor(level: 1 | 2 | 3) {
  return level === 1
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
    : level === 2
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
    : "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300";
}

export default function HistoryAttemptDetail() {
  const { attemptId } = useParams<{ attemptId: string }>();

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
          toast.error("Không tìm thấy lịch sử này");
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
          toast.error("Không tải được dữ liệu lịch sử");
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

  const Header = () => (
    <header className="mb-4">
      <div className="mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 py-3">
          {/* Tiêu đề */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Xem lại bài đã làm
          </h1>

          {/* Dòng thông tin */}
          {att && (
            <div className="flex flex-wrap items-center gap-2 xs:gap-3">
              {/* Câu đúng */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl 
                          bg-white/80 dark:bg-zinc-800/70 
                          border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm"
              >
                <ListChecks className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {att.correct}/{att.total}
                </span>
              </div>

              {/* Level */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl 
                          bg-emerald-50/80 dark:bg-emerald-900/30 
                          border border-emerald-200/70 dark:border-emerald-700/70 shadow-sm"
              >
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Level {att.level}
                </span>
              </div>

              {/* Test */}
              {typeof att.test === "number" && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl 
                            bg-sky-50/80 dark:bg-sky-900/30 
                            border border-sky-200/70 dark:border-sky-700/70 shadow-sm"
                >
                  <Hash className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Test {att.test}
                  </span>
                </div>
              )}

              {/* Thời gian */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl 
                          bg-white/80 dark:bg-zinc-800/70 
                          border border-zinc-200/70 dark:border-zinc-700/70 shadow-sm"
              >
                <Timer className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {fmtTime(att.timeSec)}
                </span>
              </div>

              {/* Ngày */}
              {atTime && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl 
                            bg-white/80 dark:bg-zinc-800/70 
                            border border-zinc-300 dark:border-zinc-600 shadow-sm"
                >
                  <CalendarClock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {new Date(atTime).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );

  function jumpTo(i: number) {
    document
      .getElementById(`q-${i + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex pt-16">
      <Sidebar
        items={items}
        answers={answersPicked}
        resp={respFake as any}
        total={items.length}
        answered={Object.keys(answersPicked).length}
        timeLabel={respFake ? fmtTime(respFake.timeSec) : "--:--"}
        onSubmit={() => {}}
        onJump={jumpTo}
        onToggleDetails={() => setShowDetails((s) => !s)}
        showDetails={showDetails}
        countdownSec={1}
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
        <Header />

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Đang tải dữ liệu…
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
            {/* Tổng quan (giữ UX giống runner) */}
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm p-6 shadow-lg">
              <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent mb-6">
                KẾT QUẢ
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Số câu đúng
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
                    Độ chính xác
                  </p>
                  <p className="text-3xl font-extrabold text-sky-700 dark:text-sky-300">
                    {respFake ? (respFake.acc * 100).toFixed(1) : "--"}%
                  </p>
                </div>

                <div className="text-center p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Thời gian
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
                {showDetails ? "Ẩn chi tiết" : "Xem chi tiết đáp án"}
              </button>
            </section>

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
                    answers={answersPicked}
                    correctMap={correctMap}
                    locked
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
  );
}
