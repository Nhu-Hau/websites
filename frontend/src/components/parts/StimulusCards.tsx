/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import type { Stimulus, Item, ChoiceId } from "@/types/tests";
import { Volume2, FileText } from "lucide-react";

type ChoiceLike = { id: ChoiceId; text?: string; content?: string };

/* =========================
   Yellow Info Block – Nâng cấp
   ========================= */
function YellowInfoBlock({ title, content, icon: Icon = FileText }: { title: string; content: string; icon?: any }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-1 shadow-sm transition-all hover:shadow-md">
      <div className="rounded-lg bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </div>
        <pre className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
          {content}
        </pre>
      </div>
    </div>
  );
}

/* =========================
   Stimulus Yellow Panel
   ========================= */
function StimulusYellowPanel({ stimulus }: { stimulus?: Stimulus | null }) {
  if (!stimulus) return null;
  const transcript = (stimulus as any)?.media?.script ?? (stimulus as any)?.script ?? null;
  const explain = (stimulus as any)?.media?.explain ?? (stimulus as any)?.explain ?? null;
  if (!transcript && !explain) return null;

  return (
    <div className="mt-4 space-y-3">
      {transcript && <YellowInfoBlock title="Transcript" content={String(transcript)} icon={Volume2} />}
      {explain && <YellowInfoBlock title="Giải thích" content={String(explain)} />}
    </div>
  );
}

/* =========================
   Helpers
   ========================= */
function toArray<T>(val?: T | T[]): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/* =========================
   Choice Row (Part 1)
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
  const itemExplain = (item as any)?.explain ?? (item as any)?.media?.explain ?? null;

  return (
    <div className="group rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-900 dark:text-white">Câu {displayIndex}</span>
        {locked ? (
          picked === correct ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
              Correct
            </span>
          ) : picked ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
              Incorrect (Correct: {correct})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Skipped (Correct: {correct})
            </span>
          )
        ) : picked ? (
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Đã chọn: {picked}
          </span>
        ) : (
          <span className="text-xs text-gray-400">Chưa chọn</span>
        )}
      </div>

      {item.stem && <p className="font-semibold text-slate-800 dark:text-slate-200 mb-3">{item.stem}</p>}

      <div className="grid grid-cols-1 gap-2">
        {((item.choices ?? []) as ChoiceLike[]).map((ch) => {
          const isCorrect = ch.id === correct;
          const isPicked = picked === ch.id;
          const label = ch.text ?? ch.content ?? "";

          let baseCls = "flex items-center gap-3 p-3 rounded-lg border text-left transition-all font-medium";
          if (!locked) {
            baseCls += isPicked
              ? " bg-slate-900 text-white border-slate-900"
              : " bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";
          } else {
            if (isCorrect) baseCls += " bg-emerald-600 text-white border-emerald-600";
            else if (isPicked && !isCorrect) baseCls += " bg-red-600 text-white border-red-600";
            else baseCls += " bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600";
          }

          return (
            <button
              key={ch.id}
              disabled={locked}
              onClick={() => onPick(ch.id)}
              className={baseCls}
            >
              <span className="font-bold">{ch.id}.</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {locked && showPerItemExplain && itemExplain && (
        <div className="mt-4">
          <YellowInfoBlock title={`Giải thích câu ${displayIndex}`} content={String(itemExplain)} />
        </div>
      )}
    </div>
  );
}

/* =========================
   Column Card
   ========================= */
export function StimulusColumnCard({
  stimulus,
  items,
  itemIndexMap,
  answers,
  correctMap,
  locked,
  onPick,
  showStimulusDetails,
  showPerItemExplain = false,
}: {
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
  const imgs = toArray((stimulus as any)?.media?.image);
  const audios = toArray((stimulus as any)?.media?.audio);

  return (
    <section className="group rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm transition-all hover:shadow-lg">
      {/* Media */}
      <div className="space-y-4 mb-6">
        {audios.map((src, i) => (
          <audio key={i} controls src={src} className="w-full rounded-lg" />
        ))}
        {imgs.map((url, i) => (
          <img key={i} src={url} alt="" className="rounded-lg border border-gray-200 dark:border-gray-600 w-full max-w-md mx-auto" />
        ))}
      </div>

      {/* Transcript/Explain */}
      {locked && showStimulusDetails && <StimulusYellowPanel stimulus={stimulus} />}

      {/* Questions */}
      <div className="space-y-5 mt-6">
        {items.map((it, iIdx) => {
          const displayIndex = (itemIndexMap.get(it.id) ?? iIdx) + 1;
          const picked = answers[it.id];
          const correct = correctMap?.[it.id];
          const itemExplain = (it as any)?.explain ?? (it as any)?.media?.explain ?? null;

          return (
            <div key={it.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Câu {displayIndex}</span>
                {locked && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    picked === correct
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : picked
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {picked === correct ? "Correct" : picked ? "Incorrect" : "Skipped"}
                  </span>
                )}
              </div>

              {it.stem && <p className="font-semibold text-slate-800 dark:text-slate-200">{it.stem}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {((it.choices ?? []) as ChoiceLike[]).map((ch) => {
                  const isCorrect = ch.id === correct;
                  const isPicked = picked === ch.id;
                  const label = ch.text ?? ch.content ?? "";

                  let cls = "p-3 rounded-lg border text-left font-medium transition-all";
                  if (!locked) {
                    cls += isPicked
                      ? " bg-slate-900 text-white border-slate-900"
                      : " bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";
                  } else {
                    if (isCorrect) cls += " bg-emerald-600 text-white border-emerald-600";
                    else if (isPicked && !isCorrect) cls += " bg-red-600 text-white border-red-600";
                    else cls += " bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600";
                  }

                  return (
                    <button
                      key={ch.id}
                      disabled={locked}
                      onClick={() => onPick(it.id, ch.id)}
                      className={cls}
                    >
                      <span className="font-bold mr-2">{ch.id}.</span>
                      {label}
                    </button>
                  );
                })}
              </div>

              {locked && showPerItemExplain && itemExplain && (
                <YellowInfoBlock title={`Giải thích câu ${displayIndex}`} content={String(itemExplain)} />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================
   Row Card (Part 1)
   ========================= */
export function StimulusRowCard({
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
  const imgs = toArray((stimulus as any)?.media?.image);
  const audios = toArray((stimulus as any)?.media?.audio);

  return (
    <section className="group rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm transition-all hover:shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Media + Transcript */}
        <div className="lg:col-span-2 space-y-4">
          {audios.map((src, i) => (
            <audio key={i} controls src={src} className="w-full rounded-lg" />
          ))}
          {imgs.map((url, i) => (
            <img key={i} src={url} alt="" className="rounded-lg border border-gray-200 dark:border-gray-600 w-full" />
          ))}
          {locked && showStimulusDetails && <StimulusYellowPanel stimulus={stimulus} />}
        </div>

        {/* RIGHT: Questions */}
        <div className="space-y-5">
          {items.map((it, iIdx) => {
            const displayIndex = (itemIndexMap.get(it.id) ?? iIdx) + 1;
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