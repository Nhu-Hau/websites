"use client";

import React from "react";
import { usePlacementTest } from "@/hooks/usePlacementTest";
import type { ChoiceId } from "@/types/tests";
import { Sidebar } from "./Sidebar";
import { ResultsPanel } from "./ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
// 🔁 dùng file gộp mới
import { StimulusRowCard, StimulusColumnCard } from "./StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlacementPage() {
  const {
    def,
    items,
    stimulusMap,
    answers,
    setAnswers,
    resp,
    timeSec,
    showDetails,
    setShowDetails,
    loading,
    submit,
    total,
    answered,
    started,
    setStarted,
  } = usePlacementTest();

  const { user } = useAuth();
  const isAuthed = !!user;
  const onLoginRequest = () =>
    toast.error("Vui lòng đăng nhập để bắt đầu làm bài");

  const { groups, itemIndexMap } = groupByStimulus(items, stimulusMap);

  function jumpTo(i: number) {
    if (!started || resp) return;
    document
      .getElementById(`q-${i + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const correctMap: Record<string, ChoiceId> | undefined = resp?.answersMap
    ? Object.fromEntries(
        Object.entries(resp.answersMap).map(([k, v]) => [k, v.correctAnswer])
      )
    : undefined;

  return (
    <div className="max-w-7xl mx-auto p-6 mt-16">
      <div className="grid grid-cols-4 gap-6">
        <Sidebar
          items={items}
          answers={answers}
          resp={resp || null}
          total={total}
          answered={answered}
          timeLabel={!resp ? fmtTime(timeSec) : fmtTime(resp.timeSec)}
          onSubmit={() => {
            if (!started) {
              onLoginRequest();
              return;
            }
            void submit();
          }}
          onJump={jumpTo}
          disabledSubmit={!total || answered === 0}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
          countdownSec={35 * 60} // 35 phút
          started={started}
          onStart={() => {
            if (!isAuthed) {
              onLoginRequest();
              return;
            }
            setStarted(true);
          }}
          isAuthed={isAuthed}
          onLoginRequest={onLoginRequest}
        />

        <main className="col-span-3">
          {loading && (
            <div className="text-sm text-gray-500">Đang tải bài kiểm tra…</div>
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
                    Thời gian <b>35 phút</b> sẽ đếm ngược sau khi bạn bắt đầu.
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
                            onLoginRequest();
                            return;
                          }
                          void submit();
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
