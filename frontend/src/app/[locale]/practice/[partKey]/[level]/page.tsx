/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams } from "next/navigation";
import type { ChoiceId, Item, Stimulus } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { Sidebar } from "@/components/parts/Sidebar";
import { ResultsPanel } from "@/components/parts/ResultsPanel";
import {
  StimulusRowCard,
  StimulusColumnCard,
} from "@/components/parts/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { toast } from "sonner";

const DURATION_MIN = 35;
const LISTENING_PARTS = new Set(["part.1", "part.2", "part.3", "part.4"]);

type ItemsResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PracticePartLevelPage() {
  const { partKey, level } = useParams<{ partKey: string; level: string }>();
  const levelNum = Number(level) as 1 | 2 | 3 | 4;

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<
    Record<string, Stimulus>
  >({});
  const [answers, setAnswers] = React.useState<Record<string, ChoiceId>>({});
  const [started, setStarted] = React.useState(false);
  const [timeSec, setTimeSec] = React.useState(0);
  const [showDetails, setShowDetails] = React.useState(false);
  const [resp, setResp] = React.useState<
    | (GradeResp & {
        predicted?: { overall: number; listening: number; reading: number };
        partStats?: Record<
          string,
          { total: number; correct: number; acc: number }
        >;
        weakParts?: string[];
      })
    | null
  >(null);

  React.useEffect(() => {
    if (!started || resp) return;
    const id = window.setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [started, resp]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setResp(null);
        setAnswers({});
        setStarted(false);
        setTimeSec(0);

        const qs = new URLSearchParams({
          level: String(levelNum),
          limit: "50",
        });
        const r = await fetch(
          `/api/parts/${encodeURIComponent(partKey)}/items?${qs}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!r.ok) {
          toast.error("Không tải được câu hỏi");
          if (mounted) {
            setItems([]);
            setStimulusMap({});
          }
          return;
        }
        const json = (await r.json()) as ItemsResp;
        if (!mounted) return;

        setItems(json.items || []);
        setStimulusMap(json.stimulusMap || {});
      } catch {
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
  }, [partKey, levelNum]);

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

  function buildResult(): GradeResp & {
    predicted: { overall: number; listening: number; reading: number };
    partStats: Record<string, { total: number; correct: number; acc: number }>;
    weakParts: string[];
  } {
    let total = items.length,
      correct = 0;
    let L = 0,
      Lc = 0,
      R = 0,
      Rc = 0;

    const answersMap: Record<string, { correctAnswer: ChoiceId }> = {};
    for (const it of items) {
      const ok = answers[it.id] === it.answer;
      if (ok) correct++;
      const isL = LISTENING_PARTS.has(it.part);
      if (isL) {
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
    const level = acc >= 0.85 ? 4 : acc >= 0.7 ? 3 : acc >= 0.55 ? 2 : 1;

    const byPart: Record<
      string,
      { total: number; correct: number; acc: number }
    > = {
      [partKey]: { total, correct, acc: total ? correct / total : 0 },
    };

    const round5 = (n: number, min: number, max: number) => {
      const x = Math.round(n / 5) * 5;
      return Math.min(max, Math.max(min, x));
    };
    const rawL = listening.acc * 495;
    const rawR = reading.acc * 495;
    const predicted = {
      listening: round5(rawL, 5, 495),
      reading: round5(rawR, 5, 495),
      overall: round5(rawL + rawR, 10, 990),
    };

    const weakParts = byPart[partKey].acc < 0.7 ? [partKey] : [];

    return {
      total,
      correct,
      acc,
      listening,
      reading,
      timeSec,
      level,
      answersMap,
      predicted,
      partStats: byPart,
      weakParts,
    };
  }

  async function submit() {
    if (!items.length) {
      toast.error("Chưa có câu hỏi để chấm");
      return;
    }
    // build payload answers
    const answersPayload: Record<string, ChoiceId> = {};
    for (const it of items) {
      if (answers[it.id] != null) answersPayload[it.id] = answers[it.id];
    }

    try {
      const res = await fetch(
        `/api/practice/parts/${encodeURIComponent(partKey)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            level: levelNum,
            answers: answersPayload,
            timeSec,
          }),
        }
      );
      if (!res.ok) throw new Error("submit failed");
      const json = await res.json();

      // build resp-like để hiển thị ngay
      const total = json.total as number;
      const correct = json.correct as number;
      const acc = json.acc as number;
      const answersMap: Record<string, { correctAnswer: ChoiceId }> = {};
      items.forEach((it) => {
        answersMap[it.id] = { correctAnswer: it.answer as ChoiceId };
      });

      const listening = {
        total: items.filter((it) =>
          ["part.1", "part.2", "part.3", "part.4"].includes(it.part)
        ).length,
        correct: items.filter(
          (it) =>
            ["part.1", "part.2", "part.3", "part.4"].includes(it.part) &&
            answers[it.id] === it.answer
        ).length,
        acc: 0,
      };
      listening.acc = listening.total ? listening.correct / listening.total : 0;

      const reading = {
        total: items.filter((it) =>
          ["part.5", "part.6", "part.7"].includes(it.part)
        ).length,
        correct: items.filter(
          (it) =>
            ["part.5", "part.6", "part.7"].includes(it.part) &&
            answers[it.id] === it.answer
        ).length,
        acc: 0,
      };
      reading.acc = reading.total ? reading.correct / reading.total : 0;

      setResp({
        total,
        correct,
        acc,
        listening,
        reading,
        timeSec,
        level: acc >= 0.85 ? 4 : acc >= 0.7 ? 3 : acc >= 0.55 ? 2 : 1,
        answersMap,
        // optional: show predicted returned by BE
        predicted: json.recommended?.predicted,
        partStats: { [partKey]: { total, correct, acc } },
        weakParts: [],
      } as any);

      toast.success("Đã nộp & cập nhật gợi ý luyện tập");
    } catch {
      toast.error("Nộp bài thất bại");
    }
  }

  function jumpTo(i: number) {
    if (!started || resp) return;
    document
      .getElementById(`q-${i + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const total = items.length;
  const answered = React.useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <div className="max-w-7xl mx-auto p-6 mt-16">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          Luyện {partKey.replace("part.", "Part ")} • Level {levelNum}
        </h1>
        <p className="text-sm text-zinc-500">
          Bộ luyện theo Part với UI như Mini TOEIC. Chọn đáp án và nộp để xem
          kết quả.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-6">
        <Sidebar
          items={items}
          answers={answers}
          resp={resp}
          total={total}
          answered={answered}
          timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
          onSubmit={() => {
            if (!started) {
              toast.error("Nhấn Bắt đầu để làm bài");
              return;
            }
            submit();
          }}
          onJump={jumpTo}
          disabledSubmit={!total || answered === 0}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
          countdownSec={DURATION_MIN * 60}
          started={started}
          onStart={() => setStarted(true)}
          isAuthed={true}
          onLoginRequest={() => {}}
        />

        <main className="col-span-3">
          {loading && (
            <div className="text-sm text-gray-500">Đang tải câu hỏi…</div>
          )}

          {!loading && (
            <>
              {!started && !resp ? (
                <div className="rounded-2xl border p-6 bg-gray-50 text-center">
                  <div className="text-lg font-semibold mb-1">
                    Nhấn <span className="underline">Bắt đầu</span> ở thanh bên
                    trái để hiển thị đề
                  </div>
                  <div className="text-sm text-gray-600">
                    Thời gian <b>{DURATION_MIN} phút</b> sẽ đếm ngược sau khi
                    bạn bắt đầu.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
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
                        locked={!!resp}
                        onPick={(itemId, choice) =>
                          setAnswers((p) => ({ ...p, [itemId]: choice }))
                        }
                        showStimulusDetails={!!resp && showDetails}
                        showPerItemExplain={!!resp && showDetails}
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
                        locked={!!resp}
                        onPick={(itemId, choice) =>
                          setAnswers((p) => ({ ...p, [itemId]: choice }))
                        }
                        showStimulusDetails={!!resp && showDetails}
                      />
                    )
                  )}

                  {!resp && items.length > 0 && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          if (!started) {
                            toast.error("Nhấn Bắt đầu để làm bài");
                            return;
                          }
                          submit();
                        }}
                        className="px-5 py-3 rounded-2xl bg-black text-white disabled:opacity-50"
                        disabled={answered === 0}
                      >
                        Nộp bài
                      </button>
                    </div>
                  )}

                  {resp && (
                    <ResultsPanel
                      resp={resp}
                      timeLabel={fmtTime(resp.timeSec)}
                      onToggleDetails={() => setShowDetails((s) => !s)}
                      showDetails={showDetails}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
