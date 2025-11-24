/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Image from "next/image";
import type { Stimulus, Item, ChoiceId } from "@/types/tests.types";
import { Volume2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "@/components/common/AudioPlayer";

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

/**
 * Tính số giây bỏ qua dựa trên part
 * Part 1: 1.5 giây
 * Part 2: 1.5 giây
 * Part 3: 2.75 giây
 * Part 4: 2.75 giây
 * Default: 2 giây
 */
function getSkipSecondsByPart(part?: string | null): number {
  if (!part) return 2;

  // Hỗ trợ cả "part.1" và "1"
  const partNum = part.includes(".")
    ? part.split(".").pop()
    : part.replace(/\D/g, "");

  const num = parseInt(partNum || "0", 10);

  switch (num) {
    case 1:
      return 1.5;
    case 2:
      return 1.5;
    case 3:
      return 2.75;
    case 4:
      return 2.75;
    default:
      return 2;
  }
}

/* ========= Info block (transcript / giải thích) ========= */

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
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg sm:rounded-xl",
        "border border-amber-100/70 bg-amber-50/60 dark:border-amber-800/70 dark:bg-amber-900/20",
        "shadow-xs sm:shadow-sm"
      )}
    >
      <div className="flex flex-col gap-1.5 rounded-lg bg-white/95 p-3 text-[13px] leading-relaxed text-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-200 xs:p-3.5 xs:text-sm">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300 xs:text-xs">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {title}
        </div>
        <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200 xs:text-[13px]">
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
    <div className="mt-3 space-y-2.5 xs:mt-4 xs:space-y-3">
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

/* ========= Choice Row ========= */

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
      {/* Header status */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 xs:gap-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 xs:text-sm">
          <span className="inline-flex h-6 min-w-[4.5rem] items-center justify-center rounded-full bg-sky-100 text-[12px] font-semibold text-zinc-900 dark:bg-sky-800 dark:text-zinc-200 xs:h-7 xs:min-w-[5.5rem] xs:text-[13px]">
            Câu {displayIndex}
          </span>
        </span>

        {locked ? (
          picked === correct ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300 xs:text-[11px]">
              Chính xác
            </span>
          ) : picked ? (
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300 xs:text-[11px]">
              Sai
              {correct && (
                <span className="ml-1 text-[10px] font-medium text-red-600/90 dark:text-red-200 xs:text-[11px]">
                  (Đúng: {correct})
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 xs:text-[11px]">
              Đã bỏ qua
              {correct && (
                <span className="ml-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-300 xs:text-[11px]">
                  (Đúng: {correct})
                </span>
              )}
            </span>
          )
        ) : picked ? (
          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200 xs:text-[11px]">
            Đã chọn: {picked}
          </span>
        ) : (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 xs:text-xs">
            Chưa chọn
          </span>
        )}
      </div>

      {/* Stem */}
      {item.stem && (
        <p className="text-[14px] font-semibold leading-relaxed text-zinc-900 dark:text-zinc-50 xs:text-[15px]">
          {String(item.stem)}
        </p>
      )}

      {/* Choices */}
      <div
        className={cn(
          "flex flex-col gap-1.5 xs:gap-2",
          isHalfWidth ? "w-full sm:w-1/2" : "w-full"
        )}
      >
        {((item.choices ?? []) as ChoiceLike[]).map((ch) => {
          const isCorrect = ch.id === correct;
          const isPicked = picked === ch.id;
          const rawLabel = ch.text ?? ch.content ?? "";
          const label =
            typeof rawLabel === "string" ? rawLabel : JSON.stringify(rawLabel);

          const base = cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-left text-[13px] sm:text-sm font-medium",
            "transition-all duration-150 border"
          );
          let cls = base;

          if (!locked) {
            if (isPicked) {
              cls = cn(
                base,
                "border-sky-500 bg-sky-50 text-sky-800 shadow-xs dark:border-sky-400 dark:bg-sky-900/40 dark:text-sky-50"
              );
            } else {
              cls = cn(
                base,
                "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100 hover:shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              );
            }
          } else {
            if (isCorrect)
              cls = cn(
                base,
                "border-lime-600 bg-lime-600 text-white shadow-xs"
              );
            else if (isPicked && !isCorrect)
              cls = cn(base, "border-red-600 bg-red-600 text-white shadow-xs");
            else
              cls = cn(
                base,
                "border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              );
          }

          return (
            <button
              key={ch.id}
              disabled={locked}
              onClick={() => onPick(ch.id)}
              className={cls}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-700 xs:h-8 xs:w-8 xs:text-[12px]">
                {ch.id}
              </span>
              <span className="text-[13px] leading-relaxed xs:text-sm">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Giải thích từng câu */}
      {locked && showPerItemExplain && itemExplain && (
        <YellowInfoBlock
          title={`Giải thích câu ${displayIndex}`}
          content={String(itemExplain)}
        />
      )}
    </div>
  );
}

/* ========= Base Props ========= */

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

/* ========= Auto layout chooser ========= */

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

/* ========= Layout: Full Width (Part 5, text only) ========= */

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
    <section
      className={cn(
        "rounded-xl sm:rounded-2xl border border-zinc-200/80 bg-white/95 p-3 xs:p-4 sm:p-5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/95"
      )}
    >
      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
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

/* ========= Layout: Image/audio sticky (Part 1–4, 6, 7 có hình) ========= */

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
  const part = (stimulus as any)?.part as string | undefined;
  const skipSeconds = getSkipSecondsByPart(part);

  return (
    <section
      className={cn(
        "rounded-xl sm:rounded-2xl border border-zinc-200/80 bg-white/95 p-3 xs:p-4 sm:p-5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/95"
      )}
    >
      <div className="grid grid-cols-1 gap-4 xs:gap-5 lg:grid-cols-5 lg:gap-6">
        {/* Media + transcript */}
        <div className="lg:col-span-3">
          <div
            className={cn(
              "max-h-[100vh] overflow-auto rounded-xl sm:rounded-2xl border border-zinc-200/80 bg-white/95 p-3 xs:p-4 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-950/95 lg:sticky lg:top-24"
            )}
          >
            {audios.length > 0 && (
              <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                {audios.map((src, i) => (
                  <AudioPlayer
                    key={i}
                    src={src}
                    skipSeconds={skipSeconds}
                    part={part}
                  />
                ))}
              </div>
            )}

            {imgs.length > 0 && (
              <div className="space-y-3">
                {imgs.map((url, i) => (
                  <div
                    key={i}
                    className="w-full overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-50 dark:border-zinc-700/80 dark:bg-zinc-900 sm:rounded-xl"
                  >
                    <Image
                      src={url}
                      alt={`Hình minh họa câu hỏi ${i + 1}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-auto object-contain"
                      priority={false}
                      onError={() => {
                        if (process.env.NODE_ENV === "development") {
                          console.error("Image load error:", url);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {locked && showStimulusDetails && (
              <div className="mt-3 xs:mt-4">
                <StimulusYellowPanel stimulus={stimulus} />
              </div>
            )}
          </div>
        </div>

        {/* Choices */}
        <div className="lg:col-span-2 space-y-4 xs:space-y-5 sm:space-y-6">
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

/* ========= Layout: Audio + text, không hình ========= */

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
  const part = (stimulus as any)?.part as string | undefined;
  const skipSeconds = getSkipSecondsByPart(part);

  return (
    <section
      className={cn(
        "rounded-xl sm:rounded-2xl border border-zinc-200/80 bg-white/95 p-3 xs:p-4 sm:p-5 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/95"
      )}
    >
      <div className="mb-5 space-y-2.5 xs:mb-6 xs:space-y-3">
        {audios.map((src, i) => (
          <AudioPlayer
            key={i}
            src={src}
            skipSeconds={skipSeconds}
            part={part}
          />
        ))}
        {locked && showStimulusDetails && (
          <StimulusYellowPanel stimulus={stimulus} />
        )}
      </div>

      <div className="space-y-4 xs:space-y-5 sm:space-y-6">
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

/* ========= Public exports ========= */

export function StimulusRowCard(props: BaseProps) {
  return <CardSticky {...props} />;
}

export function StimulusColumnCard(props: BaseProps) {
  return <StimulusAutoCard {...props} />;
}
