/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import type { Stimulus, Item, ChoiceId } from "@/types/tests";

/** Kiểu choice “mềm” để tránh any */
type ChoiceLike = {
  id: ChoiceId;
  text?: string;
  content?: string;
};

/* =========================
   Shared: Khung vàng hiển thị nội dung (transcript/explain)
   ========================= */
function YellowInfoBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-lg border p-3 bg-amber-50/60 text-amber-900">
      <div className="text-sm font-semibold">{title}</div>
      <pre className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">
        {content}
      </pre>
    </div>
  );
}

/* =========================
   Shared: Panel khung vàng cho Stimulus (Transcript/Explain)
   Có fallback field: media.script, media.explain, script, explain
   ========================= */
function StimulusYellowPanel({ stimulus }: { stimulus?: Stimulus | null }) {
  if (!stimulus) return null;

  const transcript =
    (stimulus as any)?.media?.script ??
    (stimulus as any)?.script ??
    null;

  const explain =
    (stimulus as any)?.media?.explain ??
    (stimulus as any)?.explain ??
    null;

  if (!transcript && !explain) return null;

  return (
    <div className="mt-2 grid grid-cols-1 gap-3">
      {transcript && (
        <div className="md:col-span-2">
          <YellowInfoBlock title="Transcript" content={String(transcript)} />
        </div>
      )}
      {explain && (
        <div className="md:col-span-1">
          <YellowInfoBlock title="Giải thích" content={String(explain)} />
        </div>
      )}
    </div>
  );
}

/* =========================
   Helpers: Chuẩn hoá media (image/audio là string | string[])
   ========================= */
function toArray<T>(val?: T | T[]): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/* =========================
   Shared: ChoiceRow (Row mode uses this)
   ========================= */
function ChoiceRow({
  item,
  displayIndex,
  picked,
  correct,
  locked,
  onPick,
  showPerItemExplain,
}: {
  item: Item;
  displayIndex: number;
  picked?: ChoiceId;
  correct?: ChoiceId;
  locked: boolean;
  onPick: (c: ChoiceId) => void;
  showPerItemExplain: boolean;
}) {
  const itemExplain =
    (item as any)?.explain ?? (item as any)?.media?.explain ?? null;

  return (
    <div id={`q-${displayIndex}`} className="rounded-xl border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Câu {displayIndex}:</div>
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

      {item.stem && <div className="text-md mb-2 font-bold">{item.stem}</div>}

      <div className="space-y-2">
        {((item.choices ?? []) as ChoiceLike[]).map((ch: ChoiceLike) => {
          let cls = "text-left px-3 py-2 rounded-lg border w-full";
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
          const label = ch.text ?? ch.content ?? "";
          return (
            <button
              key={ch.id}
              disabled={locked}
              className={cls}
              onClick={() => onPick(ch.id)}
            >
              <b className="mr-2">{ch.id}.</b>
              {label}
            </button>
          );
        })}
      </div>

      {locked && showPerItemExplain && !!itemExplain && (
        <div className="mt-3">
          <YellowInfoBlock
            title={`Giải thích câu ${displayIndex}`}
            content={String(itemExplain)}
          />
        </div>
      )}
    </div>
  );
}

/* =========================
   Column layout card (Part 2/3/4/5/6/7…)
   ========================= */
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
  showPerItemExplain,
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
  showPerItemExplain?: boolean;
}) {
  const imgs = toArray((stimulus as any)?.media?.image as string | string[]);
  const audios = toArray((stimulus as any)?.media?.audio as string | string[]);

  return (
    <section className="rounded-2xl border-[2px] border-gray-300 p-4 space-y-4">
      {!!imgs.length &&
        imgs.map((url, i) => (
          <img key={i} src={url} alt="" className="rounded-lg border w-3/4" />
        ))}
      {!!audios.length &&
        audios.map((src, i) => (
          <audio key={i} controls src={src} className="w-full" />
        ))}

      {locked && showStimulusDetails && <StimulusYellowPanel stimulus={stimulus} />}

      <div className="space-y-4">
        {items.map((it, iIdx) => {
          const idx0 = itemIndexMap.get(it.id);
          const displayIndex = (idx0 ?? iIdx) + 1;
          const picked = answers[it.id];
          const correct = correctMap?.[it.id];

          const itemExplain =
            (it as any)?.explain ?? (it as any)?.media?.explain ?? null;

          return (
            <div
              key={it.id}
              id={`q-${displayIndex}`}
              className="rounded-xl border p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Câu {displayIndex}:</div>
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

              {it.stem && (
                <div className="text-md mb-2 font-bold">{it.stem}</div>
              )}

              <div className="space-y-2 w-full flex flex-col">
                {((it.choices ?? []) as ChoiceLike[]).map((ch: ChoiceLike) => {
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
                  const label = ch.text ?? ch.content ?? "";
                  return (
                    <button
                      key={ch.id}
                      disabled={locked}
                      className={cls}
                      onClick={() => onPick(it.id, ch.id)}
                    >
                      <b className="mr-2">{ch.id}.</b>
                      {label}
                    </button>
                  );
                })}
              </div>

              {locked && showPerItemExplain && !!itemExplain && (
                <div className="mt-3">
                  <YellowInfoBlock
                    title={`Giải thích câu ${displayIndex}`}
                    content={String(itemExplain)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================
   Row layout card (Part 1: media trái, câu hỏi phải)
   ========================= */
export function StimulusRowCard({
  groupKey,
  stimulus,
  items,
  itemIndexMap,
  answers,
  correctMap,
  locked,
  onPick,
  showStimulusDetails,
  showPerItemExplain,
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
  showPerItemExplain: boolean;
}) {
  const imgs = toArray((stimulus as any)?.media?.image as string | string[]);
  const audios = toArray((stimulus as any)?.media?.audio as string | string[]);

  return (
    <section className="rounded-2xl border-[2px] border-gray-300 p-4">
      <div className="grid grid-cols-3 gap-4">
        {/* LEFT: media chung */}
        <div className="col-span-2 space-y-3">
          {!!audios.length &&
            audios.map((src, i) => (
              <audio key={i} controls src={src} className="w-full" />
            ))}
          {!!imgs.length && (
            <div className="space-y-2">
              {imgs.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="rounded-lg border w-full"
                />
              ))}
            </div>
          )}

          {/* Stimulus transcript/explain: KHUNG VÀNG */}
          {locked && showStimulusDetails && (
            <StimulusYellowPanel stimulus={stimulus} />
          )}
        </div>

        {/* RIGHT: tất cả câu con */}
        <div className="col-span-1 space-y-3">
          {items.map((it, iIdx) => {
            const idx0 = itemIndexMap.get(it.id);
            const displayIndex = (idx0 ?? iIdx) + 1;
            const picked = answers[it.id];
            const correct = correctMap?.[it.id];
            return (
              <ChoiceRow
                key={it.id}
                item={it}
                displayIndex={displayIndex}
                picked={picked}
                correct={correct}
                locked={locked}
                onPick={(c) => onPick(it.id, c)}
                showPerItemExplain={showPerItemExplain}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}