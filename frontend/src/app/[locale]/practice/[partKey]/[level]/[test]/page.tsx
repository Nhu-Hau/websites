/* eslint-disable @typescript-eslint/no-explicit-any */
//frontend/src/app/[locale]/practice/[partKey]/[level]/[test]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import type { ChoiceId, Item, Stimulus } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { Sidebar } from "@/components/parts/Sidebar";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/parts/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { toast } from "sonner";
import { Layers, Hash, Timer, ListChecks } from "lucide-react";

const LISTENING_PARTS = new Set(["part.1", "part.2", "part.3", "part.4"]);

// Map thời lượng theo part (phù hợp UX bạn đã set)
const PART_META: Record<
  string,
  { title: string; defaultQuestions: number; defaultDuration: number }
> = {
  "part.1": { title: "Part 1", defaultQuestions: 6, defaultDuration: 6 },
  "part.2": { title: "Part 2", defaultQuestions: 25, defaultDuration: 11 },
  "part.3": { title: "Part 3", defaultQuestions: 39, defaultDuration: 20 },
  "part.4": { title: "Part 4", defaultQuestions: 30, defaultDuration: 13 },
  "part.5": { title: "Part 5", defaultQuestions: 30, defaultDuration: 17 },
  "part.6": { title: "Part 6", defaultQuestions: 16, defaultDuration: 12 },
  "part.7": { title: "Part 7", defaultQuestions: 54, defaultDuration: 55 },
};

type ItemsResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PracticePartLevelTestPage() {
  const { partKey, level, test } = useParams<{
    partKey: string;
    level: string;
    test: string;
  }>();
  const levelNum = Number(level) as 1 | 2 | 3;
  const testNum = Number(test);

  const durationMin = PART_META[String(partKey)]?.defaultDuration ?? 35;

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<
    Record<string, Stimulus>
  >({});
  const [answers, setAnswers] = React.useState<Record<string, ChoiceId>>({});
  const [timeSec, setTimeSec] = React.useState(0);

  const [showDetails, setShowDetails] = React.useState(false);
  const [resp, setResp] = React.useState<
    | (Pick<
        GradeResp,
        | "total"
        | "correct"
        | "acc"
        | "listening"
        | "reading"
        | "timeSec"
        | "level"
      > & {
        answersMap: Record<string, { correctAnswer: ChoiceId }>;
      })
    | null
  >(null);

  // đếm thời gian
  React.useEffect(() => {
    if (resp) return;
    const id = window.setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [resp]);

  // LOAD ITEM với đủ level + test
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setResp(null);
        setAnswers({});
        setTimeSec(0);
        setShowDetails(false);

        const qs = new URLSearchParams({
          level: String(levelNum),
          test: String(testNum),
          limit: "200",
        });
        const r = await fetch(
          `/api/parts/${encodeURIComponent(partKey)}/items?${qs}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!r.ok) throw new Error("failed");
        const json = (await r.json()) as ItemsResp;
        if (!mounted) return;
        setItems(json.items || []);
        setStimulusMap(json.stimulusMap || {});
      } catch (e) {
        console.error(e);
        if (mounted) {
          toast.error("Không tải được câu hỏi");
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
  }, [partKey, levelNum, testNum]);

  const { groups, itemIndexMap } = React.useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  const correctMap: Record<string, ChoiceId> | undefined = React.useMemo(() => {
    if (!resp) return undefined;
    const map: Record<string, ChoiceId> = {};
    Object.entries(resp.answersMap || {}).forEach(([id, v]) => {
      map[id] = v.correctAnswer as ChoiceId;
    });
    return map;
  }, [resp]);

  function buildResult(): Pick<
    GradeResp,
    "total" | "correct" | "acc" | "listening" | "reading" | "timeSec" | "level"
  > & {
    answersMap: Record<string, { correctAnswer: ChoiceId }>;
  } {
    const total = items.length;
    let correct = 0;
    let L = 0,
      Lc = 0,
      R = 0,
      Rc = 0;

    const answersMap: Record<string, { correctAnswer: ChoiceId }> = {};
    for (const it of items) {
      const ok = answers[it.id] === (it.answer as ChoiceId);
      if (ok) correct++;
      if (LISTENING_PARTS.has(it.part)) {
        L++;
        if (ok) Lc++;
      } else {
        R++;
        if (ok) Rc++;
      }
      answersMap[it.id] = { correctAnswer: it.answer as ChoiceId };
    }
    const acc = total ? correct / total : 0;
    const listening = { total: L, correct: Lc, acc: L ? Lc / L : 0 };
    const reading = { total: R, correct: Rc, acc: R ? Rc / R : 0 };

    return {
      total,
      correct,
      acc,
      listening,
      reading,
      timeSec,
      level: acc >= 0.8 ? 3 : acc >= 0.5 ? 2 : 1,
      answersMap,
    };
  }

  async function submit() {
    if (!items.length) {
      toast.error("Chưa có câu hỏi để chấm");
      return;
    }
    const answersPayload: Record<string, ChoiceId> = {};
    for (const it of items)
      if (answers[it.id] != null) answersPayload[it.id] = answers[it.id];

    try {
      const res = await fetch(
        `/api/practice/parts/${encodeURIComponent(partKey)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            level: levelNum,
            test: testNum,
            answers: answersPayload,
            timeSec,
          }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = `Nộp bài thất bại (HTTP ${res.status})`;
        try {
          const j = JSON.parse(txt);
          if (j?.message) msg = `Nộp bài thất bại: ${j.message}`;
        } catch {}
        console.error("Submit error:", res.status, txt);
        toast.error(msg);
        return;
      }

      const result = buildResult();
      setResp(result);
      setShowDetails(false);
      toast.success("Đã nộp bài");

      // ✅ Lưu trạng thái “đã làm” + lịch sử (để TestCard hiện ĐÃ LÀM, /practice/history xem lại)
      try {
        const stamp = new Date().toISOString();

        // done + bestAcc
        const doneKey = `toeic.practice.done.${partKey}.${levelNum}.${testNum}`;
        const prev = JSON.parse(localStorage.getItem(doneKey) || "null") || {};
        const bestAcc = Math.max(prev.bestAcc ?? 0, result.acc ?? 0);
        localStorage.setItem(
          doneKey,
          JSON.stringify({
            lastAt: stamp,
            lastAcc: result.acc,
            bestAcc,
            attempts: (prev.attempts || 0) + 1,
          })
        );

        // append history
        const HKEY = "toeic.practice.history";
        const hist = JSON.parse(localStorage.getItem(HKEY) || "[]");
        hist.unshift({
          partKey,
          level: levelNum,
          test: testNum,
          total: result.total,
          correct: result.correct,
          acc: result.acc,
          timeSec: result.timeSec,
          at: stamp,
        });
        localStorage.setItem(HKEY, JSON.stringify(hist.slice(0, 200)));
      } catch {}
    } catch (e) {
      console.error(e);
      toast.error("Nộp bài thất bại (client error)");
    }
  }

  function jumpTo(i: number) {
    if (resp) return;
    document
      .getElementById(`q-${i + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const total = items.length;
  const answered = React.useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <div className="max-w-7xl mx-auto p-6 mt-16">
      <header className="mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Tiêu đề trái */}
          <h1 className="text-2xl font-bold">
            Luyện {String(partKey).replace("part.", "Part ")}
          </h1>

          {/* Badges phải */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-900/50 px-3 py-1.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <Layers className="h-4 w-4" />
              Level {levelNum}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/50 px-3 py-1.5 text-sm font-semibold text-blue-800 dark:text-blue-300">
              <Hash className="h-4 w-4" />
              Test {testNum}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-800/70 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <ListChecks className="h-4 w-4" />
              {total} câu
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-800/70 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Timer className="h-4 w-4" />
              {durationMin} phút
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6">
        <Sidebar
          items={items}
          answers={answers}
          resp={resp as any}
          total={total}
          answered={answered}
          timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
          onSubmit={submit}
          onJump={jumpTo}
          // disabledSubmit={!total || answered === 0}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
          countdownSec={durationMin * 60}
          started={true}
          onStart={() => {}}
          isAuthed={true}
          onLoginRequest={() => {}}
        />

        <main className="col-span-3">
          {loading && (
            <div className="text-sm text-gray-500">Đang tải câu hỏi…</div>
          )}
          {!loading &&
            (!resp ? (
              /* ===== TRƯỚC KHI NỘP ===== */
              <div className="space-y-6">
                {groups.map((g) =>
                  g.stimulus?.part === "part.1" ? (
                    <StimulusRowCard
                      key={g.key}
                      stimulus={g.stimulus}
                      items={g.items}
                      itemIndexMap={itemIndexMap}
                      answers={answers}
                      correctMap={undefined}
                      locked={false}
                      onPick={(itemId, choice) =>
                        setAnswers((p) => ({ ...p, [itemId]: choice }))
                      }
                      showStimulusDetails={false}
                      showPerItemExplain={false}
                    />
                  ) : (
                    <StimulusColumnCard
                      key={g.key}
                      stimulus={g.stimulus}
                      items={g.items}
                      itemIndexMap={itemIndexMap}
                      answers={answers}
                      correctMap={undefined}
                      locked={false}
                      onPick={(itemId, choice) =>
                        setAnswers((p) => ({ ...p, [itemId]: choice }))
                      }
                      showStimulusDetails={false}
                      showPerItemExplain={false}
                    />
                  )
                )}
              </div>
            ) : (
              /* ===== SAU KHI NỘP ===== */
              <div className="space-y-6">
                {/* Tổng quan */}
                <section className="rounded-2xl border p-6">
                  <div className="text-xl font-bold text-center">TỔNG QUAN</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-center">
                    <div className="rounded-xl border p-4">
                      <div className="text-sm text-zinc-600">Số câu đúng</div>
                      <div className="text-3xl font-extrabold">
                        {resp.correct}/{resp.total}
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="text-sm text-zinc-600">Độ chính xác</div>
                      <div className="text-3xl font-extrabold text-emerald-700">
                        {(resp.acc * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="text-sm text-zinc-600">Thời gian</div>
                      <div className="text-3xl font-extrabold">
                        {fmtTime(resp.timeSec)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setShowDetails((s) => !s)}
                      className="w-full rounded-xl border px-4 py-3 text-base font-semibold hover:bg-zinc-50"
                    >
                      {showDetails
                        ? "Ẩn chi tiết đáp án"
                        : "Xem chi tiết đáp án"}
                    </button>
                  </div>
                </section>

                {/* Review đáp án (locked): hiện transcript/explain khi bật showDetails */}
                <section className="space-y-6">
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
              </div>
            ))}
        </main>
      </div>
    </div>
  );
}
