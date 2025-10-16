/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useParams } from "next/navigation";
import type { ChoiceId, Item, Stimulus } from "@/types/tests";
import type { GradeResp } from "@/types/placement";
import { Sidebar } from "@/components/parts/Sidebar";
import { StimulusRowCard, StimulusColumnCard } from "@/components/parts/StimulusCards";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { toast } from "sonner";

const LISTENING_PARTS = new Set(["part.1","part.2","part.3","part.4"]);
const DURATION_MIN = 35;

type ItemsResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PracticePartLevelTestPage() {
  const { partKey, level, test } = useParams<{ partKey: string; level: string; test: string }>();
  const levelNum = Number(level) as 1|2|3;
  const testNum  = Number(test);

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<Record<string, Stimulus>>({});
  const [answers, setAnswers] = React.useState<Record<string, ChoiceId>>({});
  const [timeSec, setTimeSec] = React.useState(0);

  const [showDetails, setShowDetails] = React.useState(false);
  const [resp, setResp] = React.useState<(Pick<GradeResp,"total"|"correct"|"acc"|"listening"|"reading"|"timeSec"|"level"> & {
    answersMap: Record<string, { correctAnswer: ChoiceId }>
  }) | null>(null);

  React.useEffect(() => {
    if (resp) return;
    const id = window.setInterval(() => setTimeSec((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [resp]);

  // ⭕️ LOAD ITEM với đủ level + test
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
        const r = await fetch(`/api/parts/${encodeURIComponent(partKey)}/items?${qs}`, {
          credentials: "include",
          cache: "no-store",
        });
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
    return () => { mounted = false; };
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

  function buildResult(): Pick<GradeResp,"total"|"correct"|"acc"|"listening"|"reading"|"timeSec"|"level"> & {
    answersMap: Record<string, { correctAnswer: ChoiceId }>;
  } {
    const total = items.length;
    let correct = 0;
    let L=0,Lc=0,R=0,Rc=0;

    const answersMap: Record<string, { correctAnswer: ChoiceId }> = {};
    for (const it of items) {
      const ok = answers[it.id] === (it.answer as ChoiceId);
      if (ok) correct++;
      if (LISTENING_PARTS.has(it.part)) { L++; if (ok) Lc++; }
      else { R++; if (ok) Rc++; }
      answersMap[it.id] = { correctAnswer: it.answer as ChoiceId };
    }
    const acc = total ? correct / total : 0;
    const listening = { total: L, correct: Lc, acc: L ? Lc/L : 0 };
    const reading   = { total: R, correct: Rc, acc: R ? Rc/R : 0 };

    return {
      total, correct, acc, listening, reading, timeSec,
      level: acc >= 0.80 ? 3 : acc >= 0.50 ? 2 : 1,
      answersMap,
    };
  }

  async function submit() {
    if (!items.length) { toast.error("Chưa có câu hỏi để chấm"); return; }
    const answersPayload: Record<string, ChoiceId> = {};
    for (const it of items) if (answers[it.id] != null) answersPayload[it.id] = answers[it.id];

    try {
      const res = await fetch(`/api/practice/parts/${encodeURIComponent(partKey)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ level: levelNum, test: testNum, answers: answersPayload, timeSec }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = `Nộp bài thất bại (HTTP ${res.status})`;
        try { const j = JSON.parse(txt); if (j?.message) msg = `Nộp bài thất bại: ${j.message}`; } catch {}
        console.error("Submit error:", res.status, txt);
        toast.error(msg);
        return;
      }
      const result = buildResult();
      setResp(result);
      setShowDetails(false);
      toast.success("Đã nộp bài");
    } catch (e) {
      console.error(e);
      toast.error("Nộp bài thất bại (client error)");
    }
  }

  function jumpTo(i: number) {
    if (resp) return;
    document.getElementById(`q-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const total = items.length;
  const answered = React.useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <div className="max-w-7xl mx-auto p-6 mt-16">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">
          Level {levelNum} • Test {testNum}
        </h1>
        <p className="text-sm text-zinc-500">
          Chọn đáp án và nhấn <b>Nộp bài</b> để xem <b>Tổng quan</b> & <b>đáp án đúng/sai</b>.
        </p>
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
          disabledSubmit={!total || answered === 0}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
          countdownSec={DURATION_MIN * 60}
          started={true}
          onStart={() => {}}
          isAuthed={true}
          onLoginRequest={() => {}}
        />

        <main className="col-span-3">
          {loading && <div className="text-sm text-gray-500">Đang tải câu hỏi…</div>}

          {!loading && (
            !resp ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border p-4 bg-white">
                  <div className="text-sm text-zinc-700">
                    Đã chọn <b>{answered}</b>/<b>{total}</b> • Thời gian: {fmtTime(timeSec)}
                  </div>
                  <button
                    onClick={submit}
                    className="px-5 py-2 rounded-xl bg-black text-white disabled:opacity-50"
                    disabled={!total || answered === 0}
                  >
                    Nộp bài
                  </button>
                </div>

                {groups.map((g) =>
                  g.stimulus?.part === "part.1" ? (
                    <StimulusRowCard
                      key={g.key}
                      groupKey={g.key}
                      stimulus={g.stimulus}
                      items={g.items}
                      itemIndexMap={itemIndexMap}
                      answers={answers}
                      correctMap={undefined}
                      locked={false}
                      onPick={(itemId, choice) => setAnswers((p) => ({ ...p, [itemId]: choice }))}
                      showStimulusDetails={false}
                      showPerItemExplain={false}
                    />
                  ) : (
                    <StimulusColumnCard
                      key={g.key}
                      groupKey={g.key}
                      stimulus={g.stimulus}
                      items={g.items}
                      itemIndexMap={itemIndexMap}
                      answers={answers}
                      correctMap={undefined}
                      locked={false}
                      onPick={(itemId, choice) => setAnswers((p) => ({ ...p, [itemId]: choice }))}
                      showStimulusDetails={false}
                      showPerItemExplain={false}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tổng quan + Review đáp án (locked) giữ nguyên UI cũ */}
                {/* ... phần review giữ nguyên như bạn đã có ... */}
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}