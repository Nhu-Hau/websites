"use client";

import React from "react";
import type { Stimulus, Item, ChoiceId } from "@/types/tests";

export function StimulusColumnCard({
  groupKey,
  stimulus,
  items,
  itemIndexMap,
  answers,
  correctMap,
  locked,
  onPick,
  showStimulusDetails,
}: {
  groupKey: string;
  stimulus?: Stimulus | null;
  items: Item[];
  itemIndexMap: Map<string, number>;
  answers: Record<string, ChoiceId>;
  correctMap?: Record<string, ChoiceId>;
  locked: boolean;
  onPick: (itemId: string, choice: ChoiceId) => void;
  showStimulusDetails: boolean;
}) {
  const imgs = stimulus?.media?.image || [];
  const audio = stimulus?.media?.audio;
  const transcript = stimulus?.media?.script;
  const sExplain = stimulus?.media?.explain;

  return (
    <section className="rounded-2xl border-[2px] border-gray-300 p-4 space-y-4">
      {/* media chung */}
      {!!imgs.length &&
        imgs.map((url, i) => (
          <img key={i} src={url} alt="" className="rounded-lg border w-3/4" />
        ))}
      {audio && <audio controls src={audio} className="w-full" />}

      {locked && showStimulusDetails && (transcript || sExplain) && (
        <div className="grid grid-cols-1 gap-4 mt-1">
          <div className="col-span-2">
            {transcript && (
              <details open className="text-sm">
                <summary className="cursor-pointer font-medium">
                  Transcript
                </summary>
                <pre className="whitespace-pre-wrap mt-1 text-gray-700">
                  {transcript}
                </pre>
              </details>
            )}
          </div>
          <div className="col-span-1">
            {sExplain && (
              <details open className="text-sm">
                <summary className="cursor-pointer font-medium">
                  Giải thích
                </summary>
                <pre className="whitespace-pre-wrap mt-1 text-gray-700">
                  {sExplain}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* các câu con hiển thị column */}
      <div className="space-y-4">
        {items.map((it) => {
          const idx0 = itemIndexMap.get(it.id)!;
          const displayIndex = idx0 + 1;
          const picked = answers[it.id];
          const correct = correctMap?.[it.id];
          return (
            <div
              key={it.id}
              id={`q-${displayIndex}`}
              className="rounded-xl border p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">
                  Câu {displayIndex}:
                  {/* <span className="text-xs text-gray-500">({it.part})</span> */}
                </div>
                {!locked ? (
                  picked ? (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                      Đã chọn: {picked}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Chưa chọn</span>
                  )
                ) : picked ? (
                  picked === correct ? (
                    <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">
                      Đúng
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">
                      Sai (đúng: {correct})
                    </span>
                  )
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-gray-300 text-gray-800">
                    Bỏ trống (đúng: {correct})
                  </span>
                )}
              </div>

              {it.stem && <div className="text-md mb-2 font-bold">{it.stem}</div>}

              <div className="space-y-2 w-full flex flex-col">
                {(it.choices || []).map((ch) => {
                  let cls = "text-left px-3 py-2 rounded-lg border w-1/2";
                  if (!locked) {
                    cls +=
                      picked === ch.id
                        ? " bg-black text-white border-black"
                        : " hover:bg-gray-50";
                  } else {
                    if (ch.id === correct)
                      cls += " bg-green-600 text-white border-green-600";
                    else if (picked === ch.id && ch.id !== correct)
                      cls += " bg-red-600 text-white border-red-600";
                    else cls += " bg-white";
                  }
                  return (
                    <button
                      key={ch.id}
                      disabled={locked}
                      className={cls}
                      onClick={() => onPick(it.id, ch.id)}
                    >
                      <b className="mr-2">{ch.id}.</b>
                      {ch.text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
