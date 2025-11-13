/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import type { Stimulus, Item, ChoiceId } from "@/types/tests";
import { Volume2, FileText } from "lucide-react";

type ChoiceLike = { id: ChoiceId; text?: string; content?: string | any };

type CorrectMap =
  | Record<string, ChoiceId | { correctAnswer: ChoiceId }>
  | undefined;

function pickCorrect(correctMap: CorrectMap, id: string): ChoiceId | undefined {
  const v = correctMap?.[id] as any;
  if (!v) return undefined;
  if (typeof v === "object" && "correctAnswer" in v)
    return v.correctAnswer as ChoiceId;
  return v as ChoiceId;
}

function toArray<T>(val?: T | T[]): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function YellowInfoBlock({
  title,
  content,
  icon: Icon = FileText,
}: {
  title: string;
  content: string;
  icon?: any;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-1 shadow-sm">
      <div className="rounded-lg bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </div>
        <pre className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-medium">
          {content}
        </pre>
      </div>
    </div>
  );
}

function StimulusYellowPanel({ stimulus }: { stimulus?: Stimulus | null }) {
  if (!stimulus) return null;
  const transcript =
    (stimulus as any)?.media?.script ?? (stimulus as any)?.script ?? null;
  const explain =
    (stimulus as any)?.media?.explain ?? (stimulus as any)?.explain ?? null;
  if (!transcript && !explain) return null;

  return (
    <div className="mt-4 space-y-3">
      {transcript && (
        <YellowInfoBlock
          title="Transcript"
          content={String(transcript)}
          icon={Volume2}
        />
      )}
      {explain && (
        <YellowInfoBlock title="Giải thích" content={String(explain)} />
      )}
    </div>
  );
}

function ChoiceRow({
  item,
  displayIndex,
  picked,
  correct,
  locked,
  onPick,
  showPerItemExplain,
  isHalfWidth = false,
  anchorId,
}: {
  item: Item;
  displayIndex: number;
  picked?: ChoiceId;
  correct?: ChoiceId;
  locked: boolean;
  onPick: (c: ChoiceId) => void;
  showPerItemExplain: boolean;
  isHalfWidth?: boolean;
  anchorId?: string;
}) {
  const itemExplain =
    (item as any)?.explain ?? (item as any)?.media?.explain ?? null;

  return (
    <div id={anchorId} className="space-y-3 scroll-mt-24">
      <div className="flex items-center justify-between">
        <span className="font-bold text-zinc-900 dark:text-white">
          Câu {displayIndex}:
        </span>
        {locked ? (
          picked === correct ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Chính xác
            </span>
          ) : picked ? (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Sai{correct ? ` (Chính xác: ${correct})` : ""}
            </span>
          ) : (
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Đã bỏ qua{correct ? ` (Chính xác: ${correct})` : ""}
            </span>
          )
        ) : picked ? (
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Đã chọn: {picked}
          </span>
        ) : (
          <span className="text-xs text-zinc-400">Chưa chọn</span>
        )}
      </div>

      {item.stem && (
        <p className="font-bold text-zinc-800 dark:text-zinc-200">
          {String(item.stem)}
        </p>
      )}

      <div
        className={`flex flex-col gap-2 ${
          isHalfWidth ? "w-full sm:w-1/2" : "w-full"
        }`}
      >
        {((item.choices ?? []) as ChoiceLike[]).map((ch) => {
          const isCorrect = ch.id === correct;
          const isPicked = picked === ch.id;
          const labelRaw = ch.text ?? ch.content ?? "";
          const label =
            typeof labelRaw === "string" ? labelRaw : JSON.stringify(labelRaw);

          let cls =
            "flex items-center gap-3 rounded-lg px-4 py-2 text-left text-base font-medium transition-all";
          if (!locked) {
            cls += isPicked
              ? " bg-zinc-900 text-white"
              : " bg-zinc-50 dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200";
          } else {
            if (isCorrect) cls += " bg-emerald-600 text-white";
            else if (isPicked && !isCorrect) cls += " bg-rose-600 text-white";
            else
              cls +=
                " bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200";
          }

          return (
            <button
              key={ch.id}
              disabled={locked}
              onClick={() => onPick(ch.id)}
              className={cls}
            >
              <span className="font-bold">{ch.id}.</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {locked && showPerItemExplain && itemExplain && (
        <YellowInfoBlock
          title={`Giải thích câu ${displayIndex}`}
          content={String(itemExplain)}
        />
      )}
    </div>
  );
}

type BaseProps = {
  stimulus?: Stimulus | null;
  items: Item[];
  itemIndexMap: Map<string, number>;
  answers: Record<string, ChoiceId>;
  correctMap?: CorrectMap;
  locked: boolean;
  onPick: (itemId: string, choice: ChoiceId) => void;
  showStimulusDetails: boolean;
  showPerItemExplain?: boolean;
};

export function StimulusAutoCard(props: BaseProps) {
  const { stimulus } = props;
  const imgs = toArray((stimulus as any)?.media?.image);
  const audios = toArray((stimulus as any)?.media?.audio);
  const part = (stimulus as any)?.part as string | undefined;

  const hasImg = imgs.length > 0;
  const hasAudio = audios.length > 0;

  if (part === "part.5" || (!hasImg && !hasAudio))
    return <CardFullWidth {...props} />;
  if (hasImg) return <CardSticky {...props} />;
  return <CardColumnNoSticky {...props} />;
}

function CardFullWidth({
  items,
  itemIndexMap,
  answers,
  correctMap,
  locked,
  onPick,
  showPerItemExplain,
}: BaseProps) {
  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
      <div className="space-y-5">
        {items.map((it, iIdx) => {
          const displayIndex = (itemIndexMap.get(it.id) ?? iIdx) + 1;
          const correct = pickCorrect(correctMap, it.id);
          return (
            <ChoiceRow
              key={it.id}
              anchorId={`q-${displayIndex}`}
              item={it}
              displayIndex={displayIndex}
              picked={answers[it.id]}
              correct={correct}
              locked={locked}
              onPick={(c) => onPick(it.id, c)}
              showPerItemExplain={!!showPerItemExplain}
              isHalfWidth
            />
          );
        })}
      </div>
    </section>
  );
}

function CardSticky(props: BaseProps) {
  const {
    stimulus,
    items,
    itemIndexMap,
    answers,
    correctMap,
    locked,
    onPick,
    showStimulusDetails,
    showPerItemExplain,
  } = props;
  const imgs = toArray((stimulus as any)?.media?.image);
  const audios = toArray((stimulus as any)?.media?.audio);

  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-sm lg:sticky lg:top-24 max-h-[100vh] overflow-auto">
            {audios.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-4">
                {audios.map((src, i) => (
                  <audio
                    key={i}
                    controls
                    src={src}
                    className="w-full h-9 rounded-md mb-3"
                  />
                ))}
              </div>
            )}
            {imgs.length > 0 && (
              <div className="space-y-3">
                {imgs.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full object-contain rounded-lg border border-zinc-200 dark:border-zinc-700 max-h-[70vh]"
                  />
                ))}
              </div>
            )}
            {locked && showStimulusDetails && (
              <div className="mt-4">
                <StimulusYellowPanel stimulus={stimulus} />
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-5">
          {items.map((it, iIdx) => {
            const displayIndex = (itemIndexMap.get(it.id) ?? iIdx) + 1;
            const correct = pickCorrect(correctMap, it.id);
            return (
              <ChoiceRow
                key={it.id}
                anchorId={`q-${displayIndex}`}
                item={it}
                displayIndex={displayIndex}
                picked={answers[it.id]}
                correct={correct}
                locked={locked}
                onPick={(c) => onPick(it.id, c)}
                showPerItemExplain={!!showPerItemExplain}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CardColumnNoSticky(props: BaseProps) {
  const {
    stimulus,
    items,
    itemIndexMap,
    answers,
    correctMap,
    locked,
    onPick,
    showStimulusDetails,
    showPerItemExplain,
  } = props;
  const audios = toArray((stimulus as any)?.media?.audio);

  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
      <div className="space-y-3 mb-6">
        {audios.map((src, i) => (
          <audio
            key={i}
            controls
            src={src}
            className="w-full h-9 rounded-md mb-3"
          />
        ))}
        {locked && showStimulusDetails && (
          <StimulusYellowPanel stimulus={stimulus} />
        )}
      </div>
      <div className="space-y-5">
        {items.map((it, iIdx) => {
          const displayIndex = (itemIndexMap.get(it.id) ?? iIdx) + 1;
          const correct = pickCorrect(correctMap, it.id);
          return (
            <ChoiceRow
              key={it.id}
              anchorId={`q-${displayIndex}`}
              item={it}
              displayIndex={displayIndex}
              picked={answers[it.id]}
              correct={correct}
              locked={locked}
              onPick={(c) => onPick(it.id, c)}
              showPerItemExplain={!!showPerItemExplain}
              isHalfWidth
            />
          );
        })}
      </div>
    </section>
  );
}

export function StimulusRowCard(props: BaseProps) {
  return <CardSticky {...props} />;
}
export function StimulusColumnCard(props: BaseProps) {
  return <StimulusAutoCard {...props} />;
}
