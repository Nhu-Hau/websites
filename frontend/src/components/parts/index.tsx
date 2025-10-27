"use client";

import React from "react";
import { usePlacementTest } from "@/hooks/usePlacementTest";
import type { ChoiceId } from "@/types/tests";
import { Sidebar } from "./Sidebar";
import { ResultsPanel } from "./ResultsPanel";
import { groupByStimulus } from "@/utils/groupByStimulus";
import { StimulusRowCard, StimulusColumnCard } from "./StimulusCards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {Trophy} from "lucide-react"

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
    <div className="max-w-7xl mx-auto px-4 py-6 mt-16">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 p-3 shadow-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Bài kiểm tra xếp trình độ
              </h1>
              <p className="text-sm text-zinc-600">
                Làm bài để xác định cấp độ từng phần Listening & Reading.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
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
          // disabledSubmit={!total || answered === 0}
          onToggleDetails={() => setShowDetails((s) => !s)}
          showDetails={showDetails}
          countdownSec={35 * 60}
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

        {/* Main content */}
        <main className="col-span-3">
          {loading && (
            <div className="text-sm text-zinc-500 bg-white border rounded-xl p-4">
              Đang tải bài kiểm tra…
            </div>
          )}

          {!loading && (
            <>
              {!started && !resp ? (
                <div className="rounded-2xl border bg-white p-6 text-center">
                  <div className="text-lg font-semibold mb-1 text-zinc-800">
                    Nhấn <span className="underline">Bắt đầu</span> ở thanh bên
                    trái để hiển thị đề.
                  </div>
                  <div className="text-sm text-zinc-600">
                    Thời gian làm bài là <b>35 phút</b>.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {groups.map((g) =>
                    g.stimulus?.part === "part.1" ? (
                      <StimulusRowCard
                        key={g.key}
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
                        className="px-6 py-3 rounded-xl bg-black text-white hover:bg-zinc-800 transition disabled:opacity-50"
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
