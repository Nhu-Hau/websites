// frontend/src/app/[locale]/practice/history/[attemptId]/page.tsx
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
import { toast } from "sonner";
import { Layers, Hash, ListChecks, Timer, CalendarClock } from "lucide-react";

type AttemptDoc = {
  _id: string;
  partKey: string;
  level: 1|2|3|4;
  test?: number | null;
  total: number;
  correct: number;
  acc: number;        // 0..1
  timeSec: number;
  submittedAt?: string;
  createdAt?: string;
  answersMap?: Record<string, { correctAnswer: string }>;
  // (BE hiện chưa lưu userAnswers)
};

type HistoryResp = {
  page: number;
  limit: number;
  total: number;
  items: AttemptDoc[];
};

type ItemsResp = { items: Item[]; stimulusMap: Record<string, Stimulus> };

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function HistoryAttemptDetailPage() {
  const { attemptId, locale } = useParams<{ attemptId: string; locale: string }>();

  const [loading, setLoading] = React.useState(true);
  const [att, setAtt] = React.useState<AttemptDoc | null>(null);
  const [items, setItems] = React.useState<Item[]>([]);
  const [stimulusMap, setStimulusMap] = React.useState<Record<string, Stimulus>>({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // 1) Lấy toàn bộ (hoặc đủ lớn) lịch sử để tìm attempt theo _id
        const rHist = await fetch(`/api/practice/history?limit=500`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!rHist.ok) throw new Error("failed-history");
        const hist = (await rHist.json()) as HistoryResp;
        const found = (hist.items || []).find((x) => String(x._id) === String(attemptId)) || null;
        if (!mounted) return;

        if (!found) {
          toast.error("Không tìm thấy lịch sử này");
          setAtt(null);
          setItems([]);
          setStimulusMap({});
          return;
        }
        setAtt(found);

        // 2) Lấy lại đề (items + stimuli) theo part/level/test
        const qs = new URLSearchParams({
          level: String(found.level),
          limit: "200",
        });
        if (typeof found.test === "number") qs.set("test", String(found.test));
        const rItems = await fetch(`/api/parts/${encodeURIComponent(found.partKey)}/items?${qs}`, {
          credentials: "include",
          cache: "no-store",
        });
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
    return () => { mounted = false; };
  }, [attemptId]);

  const { groups, itemIndexMap } = React.useMemo(
    () => groupByStimulus(items, stimulusMap),
    [items, stimulusMap]
  );

  // ⚠️ BE hiện chưa lưu userAnswers → không có answers của user
  // => Hiển thị locked + correctMap để người học xem đáp án đúng
  const answers: Record<string, ChoiceId> = React.useMemo(() => ({}), []);
  const correctMap = React.useMemo(() => {
    if (!att?.answersMap) return undefined;
    const map: Record<string, ChoiceId> = {};
    Object.entries(att.answersMap).forEach(([id, v]) => {
      map[id] = v.correctAnswer as ChoiceId;
    });
    return map;
  }, [att]);

  const atTime = att?.submittedAt || att?.createdAt || null;

  return (
    <div className="max-w-7xl mx-auto p-6 mt-16">
      <header className="mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Xem lại bài đã làm</h1>

          {att && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
                {att.partKey.replace("part.", "Part ")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
                <Layers className="h-4 w-4" />
                Level {att.level}
              </span>
              {typeof att.test === "number" && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
                  <Hash className="h-4 w-4" />
                  Test {att.test}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
                <ListChecks className="h-4 w-4" />
                {att.correct}/{att.total} ({Math.round((att.acc ?? 0) * 100)}%)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
                <Timer className="h-4 w-4" />
                {fmtTime(att.timeSec)}
              </span>
              {atTime && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium">
                  <CalendarClock className="h-4 w-4" />
                  {new Date(atTime).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {loading && <div className="text-sm text-gray-500">Đang tải…</div>}

      {!loading && att && (
        <div className="space-y-6">
          {/* Tổng quan giống trang sau khi nộp */}
          <section className="rounded-2xl border p-6">
            <div className="text-xl font-bold text-center">TỔNG QUAN</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-center">
              <div className="rounded-xl border p-4">
                <div className="text-sm text-zinc-600">Số câu đúng</div>
                <div className="text-3xl font-extrabold">
                  {att.correct}/{att.total}
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm text-zinc-600">Độ chính xác</div>
                <div className="text-3xl font-extrabold text-emerald-700">
                  {Math.round((att.acc ?? 0) * 100)}%
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-sm text-zinc-600">Thời gian</div>
                <div className="text-3xl font-extrabold">
                  {fmtTime(att.timeSec)}
                </div>
              </div>
            </div>
          </section>

          {/* Review đáp án (locked): hiển thị transcript/explain, correctMap */}
          <section className="space-y-6">
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
                  showStimulusDetails={true}
                  showPerItemExplain={true}
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
                  showStimulusDetails={true}
                  showPerItemExplain={true}
                />
              )
            )}
          </section>
        </div>
      )}
    </div>
  );
}