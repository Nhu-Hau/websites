"use client";

import Link from "next/link";
import { useBasePrefix } from "@/hooks/routing/useBasePrefix";
import { cn } from "@/lib/utils";
import { BookOpen, ArrowRight } from "lucide-react";

const PARTS = [
  { key: "part.1", num: "1", name: "Mô tả tranh" },
  { key: "part.2", num: "2", name: "Hỏi - đáp" },
  { key: "part.3", num: "3", name: "Đoạn hội thoại" },
  { key: "part.4", num: "4", name: "Bài nói ngắn" },
  { key: "part.5", num: "5", name: "Hoàn thành câu" },
  { key: "part.6", num: "6", name: "Hoàn thành đoạn văn" },
  { key: "part.7", num: "7", name: "Đọc hiểu" },
];

export default function MobilePracticePage() {
  const base = useBasePrefix();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e5e7eb_0,_#fafafa_40%,_#f4f4f5_100%)] pt-14 pb-20 dark:bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_40%,_#020617_100%)]">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
            Luyện Listening & Reading theo từng Part
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Luyện L&R
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Chọn Part bạn muốn luyện. Hệ thống mặc định bắt đầu từ{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Level 1
                </span>{" "}
                và tự điều chỉnh theo kết quả.
              </p>
            </div>
          </div>
        </div>

        {/* Parts List */}
        <div className="space-y-3">
          {PARTS.map((part) => {
            const partIdx = part.key.split(".")[1];
            const partLabels: Record<string, string> = {
              "1": "Part 1: Mô tả tranh",
              "2": "Part 2: Hỏi - đáp",
              "3": "Part 3: Đoạn hội thoại",
              "4": "Part 4: Bài nói ngắn",
              "5": "Part 5: Hoàn thành câu",
              "6": "Part 6: Hoàn thành đoạn văn",
              "7": "Part 7: Đọc hiểu",
            };
            const partLabel = partLabels[partIdx] || `Part ${part.num}`;
            const isListening = Number(part.num) <= 4;

            return (
              <Link
                key={part.key}
                href={`${base}/practice/${part.key}?level=1`}
                className={cn(
                  "group relative block overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-3.5 shadow-sm ring-1 ring-black/[0.02]",
                  "transition-all duration-200 hover:-translate-y-[2px] hover:border-sky-300/80 hover:shadow-md",
                  "dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:hover:border-sky-700/90"
                )}
              >
                {/* subtle gradient overlay */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-100/60 blur-3xl dark:bg-sky-500/10" />
                </div>

                <div className="relative flex items-center gap-3">
                  {/* Part badge */}
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white text-lg font-semibold shadow-md transition-transform duration-200",
                      isListening
                        ? "from-sky-500 to-indigo-500"
                        : "from-emerald-500 to-teal-500",
                      "group-hover:scale-105"
                    )}
                  >
                    {part.num}
                  </div>

                  {/* Text */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          Part {part.num} · {partLabel}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {part.name}
                        </p>
                      </div>

                      {/* Listening / Reading chip */}
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          "border bg-white/80 text-zinc-700 shadow-sm dark:bg-zinc-900/80 dark:text-zinc-200",
                          isListening
                            ? "border-sky-200 dark:border-sky-700"
                            : "border-emerald-200 dark:border-emerald-700"
                        )}
                      >
                        <span
                          className={cn(
                            "mr-1 inline-block h-1.5 w-1.5 rounded-full",
                            isListening ? "bg-sky-500" : "bg-emerald-500"
                          )}
                        />
                        {isListening ? "Listening" : "Reading"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                        <span>Bắt đầu từ Level 1</span>
                        <span className="text-zinc-400">•</span>
                        <span>Tự động gợi ý lộ trình</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-600 dark:group-hover:text-sky-400" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Helper */}
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-white/80 px-3 py-2 text-[11px] text-zinc-600 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">
          Gợi ý: xen kẽ luyện{" "}
          <span className="font-semibold text-sky-700 dark:text-sky-300">
            Part 1–4
          </span>{" "}
          (Listening) và{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            Part 5–7
          </span>{" "}
          (Reading) để cân bằng hai kỹ năng.
        </div>
      </div>
    </div>
  );
}